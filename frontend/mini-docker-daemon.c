if (result == container->pid || (result == -1 && errno == ECHILD)) {
    // Process has terminated
    strcpy(container->state, STATE_STOPPED);
    container->stopped_at = time(NULL);
    printf("Container %s (ID: %s) has stopped\n", container->name, container->id);
}

// Here we could implement custom CPU scheduling policies
// For example, prioritizing certain containers, implementing time slices, etc.
// For now, we'll just use the cgroups CPU controller
}
}

pthread_mutex_unlock(&containers_lock);

// Sleep for a short period to avoid hogging CPU
usleep(100000); // 100ms
}

return NULL;
}

/* Cleanup function called on exit */
static void cleanup_and_exit(int sig) {
printf("\nShutting down Mini-Docker daemon...\n");
running = 0;

// Stop all running containers
pthread_mutex_lock(&containers_lock);
for (int i = 0; i < container_count; i++) {
if (strcmp(containers[i].state, STATE_RUNNING) == 0) {
kill(containers[i].pid, SIGTERM);
printf("Stopping container %s (ID: %s)\n", containers[i].name, containers[i].id);

// Give it a moment to terminate gracefully
sleep(1);

// Force kill if still running
if (kill(containers[i].pid, 0) == 0) {
kill(containers[i].pid, SIGKILL);
}
}
}
pthread_mutex_unlock(&containers_lock);

// Give containers a moment to fully terminate
sleep(1);

// Cleanup cgroups
system("rmdir /sys/fs/cgroup/mini-docker/* 2>/dev/null");
system("rmdir /sys/fs/cgroup/mini-docker 2>/dev/null");

exit(0);
}