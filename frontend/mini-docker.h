/*
 * mini-docker.h - Header file for the CLI interface
 */

 #ifndef MINI_DOCKER_H
 #define MINI_DOCKER_H
 
 #include <stdio.h>
 #include <stdlib.h>
 #include <string.h>
 #include <unistd.h>
 #include <getopt.h>
 #include <sys/types.h>
 #include <sys/stat.h>
 #include <fcntl.h>
 #include <errno.h>
 #include <signal.h>
 #include <json-c/json.h>
 
 /* Version information */
 #define MINI_DOCKER_VERSION "0.1.0"
 
 /* Command definitions */
 #define CMD_RUN      "run"
 #define CMD_STOP     "stop"
 #define CMD_STATS    "stats"
 #define CMD_PS       "ps"
 #define CMD_EXEC     "exec"
 #define CMD_LOGS     "logs"
 #define CMD_INFO     "info"
 #define CMD_HELP     "help"
 #define CMD_VERSION  "version"
 #define CMD_LIMIT    "limit"
 
 /* Default configuration values */
 #define DEFAULT_CPU_SHARES    1024
 #define DEFAULT_MEMORY_LIMIT  "512M"
 #define DEFAULT_ROOT_DIR      "/var/lib/mini-docker"
 #define DEFAULT_CONFIG_FILE   "/etc/mini-docker/config.json"
 #define DEFAULT_SOCKET_PATH   "/var/run/mini-docker.sock"
 
 /* Error codes */
 #define ERR_SUCCESS           0
 #define ERR_INVALID_ARGS      1
 #define ERR_RUNTIME_ERROR     2
 #define ERR_CONTAINER_NOT_FOUND 3
 #define ERR_CONFIG_ERROR      4
 #define ERR_PERMISSION_DENIED 5
 
 /* Container states */
 typedef enum {
     CONTAINER_CREATED,
     CONTAINER_RUNNING,
     CONTAINER_PAUSED,
     CONTAINER_STOPPED,
     CONTAINER_EXITED
 } container_state_t;
 
 /* Resource limits structure */
 typedef struct {
     int cpu_shares;
     char *memory_limit;
     int cpu_cores[16];   /* Array of core IDs to pin to */
     int core_count;      /* Number of CPU cores to use */
     char *gpu_device;    /* GPU device to use */
 } resource_limits_t;
 
 /* Container configuration */
 typedef struct {
     char *container_id;
     char *name;
     char *image_path;
     char *command;
     char **command_args;
     int arg_count;
     resource_limits_t resources;
     char *network_mode;
     char *mount_points[32];
     int mount_count;
     char *env_vars[64];
     int env_count;
     int interactive;
     int tty;
     int detach;
 } container_config_t;
 
 /* Function prototypes */
 void print_usage(void);
 void print_version(void);
 int parse_arguments(int argc, char **argv, container_config_t *config);
 int cmd_run(container_config_t *config);
 int cmd_stop(const char *container_id);
 int cmd_stats(const char *container_id, int watch_mode);
 int cmd_ps(int show_all);
 int cmd_exec(const char *container_id, char **cmd, int cmd_len);
 int cmd_logs(const char *container_id, int follow);
 int cmd_info(const char *container_id);
 int cmd_limit(const char *container_id, resource_limits_t *limits);
 char *generate_container_id(void);
 void free_container_config(container_config_t *config);
 int validate_config(container_config_t *config);
 json_object *get_stats_data(const char *container_id);
 int connect_to_daemon(void);
 void close_daemon_connection(void);
 int send_command_to_daemon(const char *command, json_object *args);
 
 #endif /* MINI_DOCKER_H */