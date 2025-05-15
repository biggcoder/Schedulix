// mini-docker.c - Core Container Runtime
// A lightweight container system using Linux namespaces and cgroups

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
#include <sys/syscall.h>
#include <linux/limits.h>

// Configuration structure for our container
typedef struct {
    char *hostname;
    char *rootfs;
    char *command;
    char **command_args;
    int cpu_shares;
    long mem_limit;
    char *cgroup_path;
    char *container_id;
} container_config;

// Function prototypes
int setup_cgroup(container_config *config);
int setup_namespaces();
int setup_mounts(container_config *config);
int child_exec(void *arg);
void cleanup_cgroup(container_config *config);

// Stack size for clone
#define STACK_SIZE (1024 * 1024)

// Generate a unique container ID
void generate_container_id(container_config *config) {
    static int counter = 0;
    char id[32];
    snprintf(id, sizeof(id), "mini_%d", counter++);
    config->container_id = strdup(id);
}

// Set up cgroups for resource limitations
int setup_cgroup(container_config *config) {
    char path[PATH_MAX];
    char value[32];
    FILE *fp;
    
    // Create cgroup directory
    snprintf(path, sizeof(path), "/sys/fs/cgroup/mini/%s", config->container_id);
    if (mkdir(path, 0755) == -1 && errno != EEXIST) {
        perror("mkdir cgroup");
        return -1;
    }
    
    // Store the path
    config->cgroup_path = strdup(path);
    
    // Set CPU shares
    snprintf(path, sizeof(path), "%s/cpu.weight", config->cgroup_path);
    fp = fopen(path, "w");
    if (!fp) {
        perror("fopen cpu.weight");
        return -1;
    }
    snprintf(value, sizeof(value), "%d", config->cpu_shares);
    fputs(value, fp);
    fclose(fp);
    
    // Set memory limit
    snprintf(path, sizeof(path), "%s/memory.max", config->cgroup_path);
    fp = fopen(path, "w");
    if (!fp) {
        perror("fopen memory.max");
        return -1;
    }
    snprintf(value, sizeof(value), "%ld", config->mem_limit);
    fputs(value, fp);
    fclose(fp);
    
    // Add current process (will be the container's init) to cgroup
    snprintf(path, sizeof(path), "%s/cgroup.procs", config->cgroup_path);
    fp = fopen(path, "w");
    if (!fp) {
        perror("fopen cgroup.procs");
        return -1;
    }
    fprintf(fp, "%d", getpid());
    fclose(fp);
    
    return 0;
}

// Set up namespaces for isolation
int setup_namespaces() {
    // Unshare namespaces
    if (unshare(CLONE_NEWUTS | CLONE_NEWPID | CLONE_NEWNS | CLONE_NEWNET | CLONE_NEWIPC) == -1) {
        perror("unshare");
        return -1;
    }
    return 0;
}

// Set up mount points inside the container
int setup_mounts(container_config *config) {
    // Make the rootfs private to avoid propagating mounts
    if (mount(NULL, "/", NULL, MS_PRIVATE | MS_REC, NULL) == -1) {
        perror("mount private");
        return -1;
    }
    
    // Mount the new root
    if (mount(config->rootfs, config->rootfs, NULL, MS_BIND | MS_REC, NULL) == -1) {
        perror("mount rootfs");
        return -1;
    }
    
    // chroot to the new root
    if (chdir(config->rootfs) == -1) {
        perror("chdir rootfs");
        return -1;
    }
    
    if (chroot(".") == -1) {
        perror("chroot");
        return -1;
    }
    
    // Set hostname
    if (sethostname(config->hostname, strlen(config->hostname)) == -1) {
        perror("sethostname");
        return -1;
    }
    
    // Mount /proc inside container
    if (mount("proc", "/proc", "proc", 0, NULL) == -1) {
        perror("mount proc");
        return -1;
    }
    
    return 0;
}

// Function executed by the child process after clone
int child_exec(void *arg) {
    container_config *config = (container_config *)arg;
    
    // Set up namespaces
    if (setup_namespaces() == -1) {
        return EXIT_FAILURE;
    }
    
    // Set up cgroups
    if (setup_cgroup(config) == -1) {
        return EXIT_FAILURE;
    }
    
    // Set up mounts
    if (setup_mounts(config) == -1) {
        return EXIT_FAILURE;
    }
    
    // Execute the command
    if (execvp(config->command, config->command_args) == -1) {
        perror("execvp");
        return EXIT_FAILURE;
    }
    
    return EXIT_SUCCESS; // Never reached
}

// Clean up the cgroup when container exits
void cleanup_cgroup(container_config *config) {
    char path[PATH_MAX];
    
    // Remove the cgroup
    snprintf(path, sizeof(path), "rmdir %s", config->cgroup_path);
    system(path);
    
    free(config->cgroup_path);
}

// Entry point for container creation
pid_t create_container(container_config *config) {
    char *stack;
    pid_t pid;
    
    // Allocate stack for child
    stack = malloc(STACK_SIZE);
    if (!stack) {
        perror("malloc stack");
        return -1;
    }
    
    // Generate a container ID
    generate_container_id(config);
    
    // Clone a new process
    pid = clone(child_exec, stack + STACK_SIZE, 
              CLONE_NEWUTS | CLONE_NEWPID | CLONE_NEWNS | CLONE_NEWNET | CLONE_NEWIPC | SIGCHLD, 
              config);
    
    if (pid == -1) {
        perror("clone");
        free(stack);
        return -1;
    }
    
    printf("Created container with ID: %s, PID: %d\n", config->container_id, pid);
    
    // Wait for the container to exit
    waitpid(pid, NULL, 0);
    
    // Clean up
    cleanup_cgroup(config);
    free(stack);
    
    return pid;
}

// Main function to parse arguments and start container
int main(int argc, char *argv[]) {
    container_config config = {
        .hostname = "mini-container",
        .rootfs = "/var/lib/mini-docker/rootfs", // Default rootfs path
        .command = "/bin/sh",
        .command_args = NULL,
        .cpu_shares = 1024, // Default CPU shares
        .mem_limit = 512 * 1024 * 1024 // Default memory limit: 512MB
    };
    
    // Simple argument parsing
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--hostname") == 0 && i + 1 < argc) {
            config.hostname = argv[++i];
        } else if (strcmp(argv[i], "--rootfs") == 0 && i + 1 < argc) {
            config.rootfs = argv[++i];
        } else if (strcmp(argv[i], "--cpu-shares") == 0 && i + 1 < argc) {
            config.cpu_shares = atoi(argv[++i]);
        } else if (strcmp(argv[i], "--memory") == 0 && i + 1 < argc) {
            long mem = atol(argv[++i]);
            // Convert from MB to bytes
            config.mem_limit = mem * 1024 * 1024;
        } else if (strcmp(argv[i], "--") == 0) {
            // Command and its arguments follow
            if (i + 1 < argc) {
                config.command = argv[i + 1];
                config.command_args = &argv[i + 1];
            }
            break;
        }
    }
    
    // If no command was specified, use default
    if (!config.command_args) {
        // Default: run a shell
        char *default_args[] = {config.command, NULL};
        config.command_args = default_args;
    }
    
    // Create and start the container
    create_container(&config);
    
    return 0;
}