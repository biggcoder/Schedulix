// mini-scheduler.c - Custom process scheduler for our container system
// This implements a custom scheduling policy for containerized processes

#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <errno.h>
#include <sched.h>
#include <signal.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <sys/mount.h>
#include <time.h>
#include <dirent.h>
#include <pthread.h>

// Container info structure
typedef struct {
    char id[32];
    pid_t pid;
    int priority;        // 1-100, higher number = higher priority
    int cpu_share;       // CPU share value
    long mem_limit;      // Memory limit in bytes
    int policy;          // Scheduling policy: 0=fair, 1=priority, 2=realtime
    struct timespec last_scheduled; // Last time this container was scheduled
} container_info;

// Global container registry
#define MAX_CONTAINERS 100
container_info containers[MAX_CONTAINERS];
int container_count = 0;
pthread_mutex_t container_mutex = PTHREAD_MUTEX_INITIALIZER;

// Scheduling policies
#define SCHED_FAIR 0      // Fair distribution of CPU time
#define SCHED_PRIORITY 1  // Priority-based scheduling
#define SCHED_REALTIME 2  // Realtime-like scheduling with preemption

// Function prototypes
void register_container(const char *id, pid_t pid, int priority, int cpu_share, long mem_limit, int policy);
void unregister_container(const char *id);
void *scheduler_thread(void *arg);
void adjust_container_shares();
int get_process_stats(pid_t pid, unsigned long *cpu_usage, unsigned long *mem_usage);
void boost_interactive_containers();
void apply_scheduling_policy();

// Register a new container with the scheduler
void register_container(const char *id, pid_t pid, int priority, int cpu_share, long mem_limit, int policy) {
    pthread_mutex_lock(&container_mutex);
    
    if (container_count < MAX_CONTAINERS) {
        container_info *container = &containers[container_count++];
        strncpy(container->id, id, sizeof(container->id) - 1);
        container->pid = pid;
        container->priority = (priority < 1) ? 1 : (priority > 100) ? 100 : priority;
        container->cpu_share = cpu_share;
        container->mem_limit = mem_limit;
        container->policy = policy;
        clock_gettime(CLOCK_MONOTONIC, &container->last_scheduled);
        
        printf("Registered container %s (PID: %d) with scheduler, priority=%d, policy=%d\n", 
               id, pid, container->priority, policy);
    } else {
        fprintf(stderr, "Cannot register container %s: maximum number of containers reached\n", id);
    }
    
    pthread_mutex_unlock(&container_mutex);
}

// Unregister a container from the scheduler
void unregister_container(const char *id) {
    pthread_mutex_lock(&container_mutex);
    
    for (int i = 0; i < container_count; i++) {
        if (strcmp(containers[i].id, id) == 0) {
            // Move the last container to this position
            if (i < container_count - 1) {
                containers[i] = containers[container_count - 1];
            }
            container_count--;
            printf("Unregistered container %s from scheduler\n", id);
            break;
        }
    }
    
    pthread_mutex_unlock(&container_mutex);
}

// Get CPU and memory usage for a process
int get_process_stats(pid_t pid, unsigned long *cpu_usage, unsigned long *mem_usage) {
    char path[128];
    FILE *fp;
    char line[256];
    
    // Get CPU usage from /proc/<pid>/stat
    snprintf(path, sizeof(path), "/proc/%d/stat", pid);
    fp = fopen(path, "r");
    if (!fp) {
        return -1;
    }
    
    if (fgets(line, sizeof(line), fp)) {
        unsigned long utime, stime;
        // Extract utime and stime (fields 14 and 15)
        char *token = strtok(line, " ");
        for (int i = 1; i < 14; i++) {
            token = strtok(NULL, " ");
        }
        utime = atol(token);
        token = strtok(NULL, " ");
        stime = atol(token);
        
        *cpu_usage = utime + stime;
    }
    fclose(fp);
    
    // Get memory usage from /proc/<pid>/status
    snprintf(path, sizeof(path), "/proc/%d/status", pid);
    fp = fopen(path, "r");
    if (!fp) {
        return -1;
    }
    
    *mem_usage = 0;
    while (fgets(line, sizeof(line), fp)) {
        // Look for VmRSS line
        if (strncmp(line, "VmRSS:", 6) == 0) {
            char *value = line + 6;
            while (*value == ' ' || *value == '\t') value++;
            *mem_usage = atol(value);
            break;
        }
    }
    fclose(fp);
    
    return 0;
}

// Apply scheduling policy to all containers
void apply_scheduling_policy() {
    pthread_mutex_lock(&container_mutex);
    
    // Apply the appropriate scheduling policy for each container
    for (int i = 0; i < container_count; i++) {
        container_info *container = &containers[i];
        char path[128];
        FILE *fp;
        int new_cpu_share = container->cpu_share;
        
        // Adjust CPU shares based on policy
        switch (container->policy) {
            case SCHED_PRIORITY:
                // Priority-based: CPU shares proportional to priority
                new_cpu_share = container->priority * 10;
                break;
                
            case SCHED_REALTIME:
                // Realtime-like: give high priority containers much more CPU
                if (container->priority > 80) {
                    new_cpu_share = container->cpu_share * 5;
                } else if (container->priority > 50) {
                    new_cpu_share = container->cpu_share * 2;
                }
                break;
                
            case SCHED_FAIR:
            default:
                // Fair scheduling: leave the CPU shares as they are
                break;
        }
        
        // Write new CPU shares to cgroup
        snprintf(path, sizeof(path), "/sys/fs/cgroup/mini/%s/cpu.weight", container->id);
        fp = fopen(path, "w");
        if (fp) {
            fprintf(fp, "%d", new_cpu_share);
            fclose(fp);
        }
        
        // Update timestamp for container
        clock_gettime(CLOCK_MONOTONIC, &container->last_scheduled);
    }
    
    pthread_mutex_unlock(&container_mutex);
}

// Boost interactive containers (those with frequent short CPU bursts)
void boost_interactive_containers() {
    pthread_mutex_lock(&container_mutex);
    
    for (int i = 0; i < container_count; i++) {
        container_info *container = &containers[i];
        unsigned long cpu_usage, mem_usage;
        
        // Get current resource usage
        if (get_process_stats(container->pid, &cpu_usage, &mem_usage) == 0) {
            // Detect interactive patterns (just a simple heuristic for now)
            if (cpu_usage < 1000) {  // Low CPU usage
                char path[128];
                FILE *fp;
                
                // Give it a temporary boost in CPU share
                snprintf(path, sizeof(path), "/sys/fs/cgroup/mini/%s/cpu.weight", container->id);
                fp = fopen(path, "w");
                if (fp) {
                    fprintf(fp, "%d", container->cpu_share * 2);  // Double CPU share
                    fclose(fp);
                    
                    printf("Boosted interactive container %s temporarily\n", container->id);
                }
            }
        }
    }
    
    pthread_mutex_unlock(&container_mutex);
}

// Scheduler thread function
void *scheduler_thread(void *arg) {
    while (1) {
        // Apply scheduling policy
        apply_scheduling_policy();
        
        // Look for interactive containers and boost them
        boost_interactive_containers();
        
        // Sleep for a while before next scheduling round
        usleep(100000);  // 100ms scheduling interval
    }
    
    return NULL;
}

// Start the scheduler thread
void start_scheduler() {
    pthread_t thread;
    pthread_create(&thread, NULL, scheduler_thread, NULL);
    pthread_detach(thread);
    
    printf("Custom scheduler started\n");
}

// Update scheduling policy for a container
void update_container_policy(const char *id, int policy, int priority) {
    pthread_mutex_lock(&container_mutex);
    
    for (int i = 0; i < container_count; i++) {
        if (strcmp(containers[i].id, id) == 0) {
            containers[i].policy = policy;
            containers[i].priority = (priority < 1) ? 1 : (priority > 100) ? 100 : priority;
            
            printf("Updated container %s: policy=%d, priority=%d\n", 
                   id, policy, containers[i].priority);
            break;
        }
    }
    
    pthread_mutex_unlock(&container_mutex);
}

// Main function - can be used for testing the scheduler
int main(int argc, char *argv[]) {
    printf("Mini-Docker Custom Scheduler\n");
    
    // Start the scheduler
    start_scheduler();
    
    // Keep the program running
    while (1) {
        sleep(1);
    }
    
    return 0;
}