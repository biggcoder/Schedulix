/*
 * mini-docker.c - Main CLI for the custom container runtime
 * 
 * This file implements the command-line interface for our custom container
 * system. It parses user commands and communicates with the container runtime
 * daemon to perform the requested operations.
 */

 #include "mini-docker.h"

 /* Global variables */
 int daemon_socket = -1;
 char *config_file = DEFAULT_CONFIG_FILE;
 int verbose_mode = 0;
 
 void print_usage(void) {
     printf("mini-docker - A lightweight container runtime\n\n");
     printf("Usage: mini-docker COMMAND [OPTIONS]\n\n");
     printf("Commands:\n");
     printf("  run       Create and start a new container\n");
     printf("  stop      Stop a running container\n");
     printf("  stats     Display resource usage statistics for containers\n");
     printf("  ps        List containers\n");
     printf("  exec      Execute a command in a running container\n");
     printf("  logs      View the logs of a container\n");
     printf("  info      Display detailed information about a container\n");
     printf("  limit     Update resource limits for a running container\n");
     printf("  help      Show this help information\n");
     printf("  version   Show version information\n\n");
     
     printf("Run 'mini-docker COMMAND --help' for more information on a command\n");
 }
 
 void print_version(void) {
     printf("mini-docker version %s\n", MINI_DOCKER_VERSION);
 }
 
 void print_run_usage(void) {
     printf("Usage: mini-docker run [OPTIONS] IMAGE [COMMAND] [ARG...]\n\n");
     printf("Options:\n");
     printf("  --name string        Assign a name to the container\n");
     printf("  -c, --cpu-shares     CPU shares (relative weight)\n");
     printf("  -m, --memory limit   Memory limit (e.g., 512M, 1G)\n");
     printf("  --cpuset-cpus        CPUs in which to allow execution (0-3, 0,1)\n");
     printf("  --gpuset-gpus        GPUs in which to allow execution (0, 1)\n");
     printf("  -e, --env            Set environment variables\n");
     printf("  -v, --volume         Bind mount a volume\n");
     printf("  -i, --interactive    Keep STDIN open even if not attached\n");
     printf("  -t, --tty            Allocate a pseudo-TTY\n");
     printf("  -d, --detach         Run container in background\n");
 }
 
 void print_stop_usage(void) {
     printf("Usage: mini-docker stop [OPTIONS] CONTAINER [CONTAINER...]\n\n");
     printf("Options:\n");
     printf("  -t, --time int   Seconds to wait for stop before killing it (default 10)\n");
 }
 
 void print_stats_usage(void) {
     printf("Usage: mini-docker stats [OPTIONS] [CONTAINER...]\n\n");
     printf("Options:\n");
     printf("  -a, --all        Show stats for all containers, not just running\n");
     printf("  --no-stream      Disable streaming stats and only pull one time\n");
 }
 
 void print_ps_usage(void) {
     printf("Usage: mini-docker ps [OPTIONS]\n\n");
     printf("Options:\n");
     printf("  -a, --all        Show all containers (default shows just running)\n");
 }
 
 void print_exec_usage(void) {
     printf("Usage: mini-docker exec [OPTIONS] CONTAINER COMMAND [ARG...]\n\n");
     printf("Options:\n");
     printf("  -i, --interactive    Keep STDIN open even if not attached\n");
     printf("  -t, --tty            Allocate a pseudo-TTY\n");
 }
 
 void print_logs_usage(void) {
     printf("Usage: mini-docker logs [OPTIONS] CONTAINER\n\n");
     printf("Options:\n");
     printf("  -f, --follow         Follow log output\n");
     printf("  --tail int           Number of lines to show from the end of the logs\n");
 }
 
 void print_info_usage(void) {
     printf("Usage: mini-docker info [OPTIONS] [CONTAINER]\n\n");
     printf("Options:\n");
     printf("  --format string      Format the output using the given template\n");
 }
 
 void print_limit_usage(void) {
     printf("Usage: mini-docker limit [OPTIONS] CONTAINER\n\n");
     printf("Options:\n");
     printf("  -c, --cpu-shares     CPU shares (relative weight)\n");
     printf("  -m, --memory limit   Memory limit (e.g., 512M, 1G)\n");
     printf("  --cpuset-cpus        CPUs in which to allow execution (0-3, 0,1)\n");
     printf("  --gpuset-gpus        GPUs in which to allow execution (0, 1)\n");
 }
 
 /**
  * Connect to the runtime daemon
  */
 int connect_to_daemon(void) {
     struct sockaddr_un addr;
     int fd;
     
     if ((fd = socket(AF_UNIX, SOCK_STREAM, 0)) == -1) {
         perror("socket error");
         return -1;
     }
     
     memset(&addr, 0, sizeof(addr));
     addr.sun_family = AF_UNIX;
     strncpy(addr.sun_path, DEFAULT_SOCKET_PATH, sizeof(addr.sun_path) - 1);
     
     if (connect(fd, (struct sockaddr*)&addr, sizeof(addr)) == -1) {
         perror("connect error");
         close(fd);
         return -1;
     }
     
     daemon_socket = fd;
     return fd;
 }
 
 /**
  * Close connection to the daemon
  */
 void close_daemon_connection(void) {
     if (daemon_socket != -1) {
         close(daemon_socket);
         daemon_socket = -1;
     }
 }
 
 /**
  * Send a command to the daemon and get the response
  */
 int send_command_to_daemon(const char *command, json_object *args) {
     json_object *request = json_object_new_object();
     json_object *response = NULL;
     char buffer[4096];
     ssize_t bytes_read;
     int status = 0;
     
     /* Create the JSON request */
     json_object_object_add(request, "command", json_object_new_string(command));
     if (args) {
         json_object_object_add(request, "args", args);
     }
     
     /* Send the request */
     const char *json_str = json_object_to_json_string(request);
     if (write(daemon_socket, json_str, strlen(json_str)) == -1) {
         perror("write error");
         status = ERR_RUNTIME_ERROR;
         goto cleanup;
     }
     
     /* Read the response */
     bytes_read = read(daemon_socket, buffer, sizeof(buffer) - 1);
     if (bytes_read <= 0) {
         perror("read error");
         status = ERR_RUNTIME_ERROR;
         goto cleanup;
     }
     
     buffer[bytes_read] = '\0';
     
     /* Parse the response */
     response = json_tokener_parse(buffer);
     if (!response) {
         fprintf(stderr, "Error parsing JSON response\n");
         status = ERR_RUNTIME_ERROR;
         goto cleanup;
     }
     
     /* Check for error in response */
     json_object *error_obj;
     if (json_object_object_get_ex(response, "error", &error_obj)) {
         fprintf(stderr, "Error: %s\n", 
                 json_object_get_string(error_obj));
         status = ERR_RUNTIME_ERROR;
         goto cleanup;
     }
     
     /* Process success response */
     json_object *result_obj;
     if (json_object_object_get_ex(response, "result", &result_obj)) {
         /* Print pretty JSON if result is complex */
         if (json_object_get_type(result_obj) == json_type_object ||
             json_object_get_type(result_obj) == json_type_array) {
             printf("%s\n", json_object_to_json_string_ext(result_obj, 
                    JSON_C_TO_STRING_PRETTY | JSON_C_TO_STRING_SPACED));
         } else {
             /* Simple value */
             printf("%s\n", json_object_get_string(result_obj));
         }
     }
     
 cleanup:
     if (request) json_object_put(request);
     if (response) json_object_put(response);
     return status;
 }
 
 /**
  * Parse CPU set specification like "0,1,2" or "0-3"
  */
 int parse_cpuset(const char *cpuset_str, int *cores, int max_cores) {
     char *str = strdup(cpuset_str);
     char *token, *subtoken;
     char *saveptr1, *saveptr2;
     int count = 0;
     
     token = strtok_r(str, ",", &saveptr1);
     while (token && count < max_cores) {
         /* Check if it's a range (e.g., "0-3") */
         if (strchr(token, '-')) {
             int start, end;
             subtoken = strtok_r(token, "-", &saveptr2);
             if (!subtoken) continue;
             start = atoi(subtoken);
             
             subtoken = strtok_r(NULL, "-", &saveptr2);
             if (!subtoken) continue;
             end = atoi(subtoken);
             
             for (int i = start; i <= end && count < max_cores; i++) {
                 cores[count++] = i;
             }
         } else {
             /* Single value */
             cores[count++] = atoi(token);
         }
         
         token = strtok_r(NULL, ",", &saveptr1);
     }
     
     free(str);
     return count;
 }
 
 /**
  * Parse memory limit string like "512M" or "1G"
  */
 long long parse_memory_limit(const char *limit) {
     char *endptr;
     long long value = strtoll(limit, &endptr, 10);
     
     if (*endptr != '\0') {
         switch (*endptr) {
             case 'k':
             case 'K':
                 value *= 1024;
                 break;
             case 'm':
             case 'M':
                 value *= 1024 * 1024;
                 break;
             case 'g':
             case 'G':
                 value *= 1024 * 1024 * 1024;
                 break;
             default:
                 /* Invalid suffix */
                 return -1;
         }
     }
     
     return value;
 }
 
 /**
  * Parse command line arguments for the 'run' command
  */
 int parse_run_args(int argc, char **argv, container_config_t *config) {
     int option;
     int option_index = 0;
     
     static struct option long_options[] = {
         {"name",        required_argument, 0, 'n'},
         {"cpu-shares",  required_argument, 0, 'c'},
         {"memory",      required_argument, 0, 'm'},
         {"cpuset-cpus", required_argument, 0, 's'},
         {"gpuset-gpus", required_argument, 0, 'g'},
         {"env",         required_argument, 0, 'e'},
         {"volume",      required_argument, 0, 'v'},
         {"interactive", no_argument,       0, 'i'},
         {"tty",         no_argument,       0, 't'},
         {"detach",      no_argument,       0, 'd'},
         {"help",        no_argument,       0, 'h'},
         {0, 0, 0, 0}
     };
     
     /* Set defaults */
     config->resources.cpu_shares = DEFAULT_CPU_SHARES;
     config->resources.memory_limit = strdup(DEFAULT_MEMORY_LIMIT);
     config->resources.core_count = 0;
     config->resources.gpu_device = NULL;
     config->interactive = 0;
     config->tty = 0;
     config->detach = 0;
     config->mount_count = 0;
     config->env_count = 0;
     
     /* Parse options */
     while ((option = getopt_long(argc, argv, "n:c:m:e:v:itdh",
                                 long_options, &option_index)) != -1) {
         switch (option) {
             case 'n':
                 config->name = strdup(optarg);
                 break;
             case 'c':
                 config->resources.cpu_shares = atoi(optarg);
                 break;
             case 'm':
                 free(config->resources.memory_limit);
                 config->resources.memory_limit = strdup(optarg);
                 break;
             case 's':
                 config->resources.core_count = 
                     parse_cpuset(optarg, config->resources.cpu_cores, 16);
                 break;
             case 'g':
                 config->resources.gpu_device = strdup(optarg);
                 break;
             case 'e':
                 if (config->env_count < 64) {
                     config->env_vars[config->env_count++] = strdup(optarg);
                 }
                 break;
             case 'v':
                 if (config->mount_count < 32) {
                     config->mount_points[config->mount_count++] = strdup(optarg);
                 }
                 break;
             case 'i':
                 config->interactive = 1;
                 break;
             case 't':
                 config->tty = 1;
                 break;
             case 'd':
                 config->detach = 1;
                 break;
             case 'h':
                 print_run_usage();
                 return -1;
             default:
                 print_run_usage();
                 return -1;
         }
     }
     
     /* Make sure we have at least an image name */
     if (optind >= argc) {
         fprintf(stderr, "Error: Image name is required\n");
         print_run_usage();
         return -1;
     }
     
     /* Get the image path (mandatory) */
     config->image_path = strdup(argv[optind++]);
     
     /* Get the command and arguments (optional) */
     if (optind < argc) {
         config->command = strdup(argv[optind++]);
         
         /* Collect remaining arguments */
         int arg_count = 0;
         while (optind < argc && arg_count < 64) {
             config->command_args[arg_count++] = strdup(argv[optind++]);
         }
         config->arg_count = arg_count;
     }
     
     /* Generate a container ID if no name specified */
     if (!config->name) {
         config->container_id = generate_container_id();
     } else {
         config->container_id = strdup(config->name);
     }
     
     return 0;
 }
 
 /**
  * Generate a unique container ID
  */
 char *generate_container_id(void) {
     char *id = malloc(13); /* 12 chars + null terminator */
     static const char chars[] = 
         "abcdefghijklmnopqrstuvwxyz0123456789";
     
     /* Seed the random number generator */
     srand(time(NULL));
     
     /* Generate a random 12-character ID */
     for (int i = 0; i < 12; i++) {
         id[i] = chars[rand() % (sizeof(chars) - 1)];
     }
     id[12] = '\0';
     
     return id;
 }
 
 /**
  * Free resources allocated for container config
  */
 void free_container_config(container_config_t *config) {
     if (!config) return;
     
     free(config->container_id);
     free(config->name);
     free(config->image_path);
     free(config->command);
     
     for (int i = 0; i < config->arg_count; i++) {
         free(config->command_args[i]);
     }
     
     free(config->resources.memory_limit);
     free(config->resources.gpu_device);
     
     for (int i = 0; i < config->mount_count; i++) {
         free(config->mount_points[i]);
     }
     
     for (int i = 0; i < config->env_count; i++) {
         free(config->env_vars[i]);
     }
 }
 
 /**
  * Validate container configuration
  */
 int validate_config(container_config_t *config) {
     /* Check for required fields */
     if (!config->image_path) {
         fprintf(stderr, "Error: Image path is required\n");
         return 0;
     }
     
     /* Validate memory limit format */
     if (config->resources.memory_limit) {
         if (parse_memory_limit(config->resources.memory_limit) < 0) {
             fprintf(stderr, "Error: Invalid memory limit format: %s\n", 
                     config->resources.memory_limit);
             return 0;
         }
     }
     
     /* Validate CPU shares */
     if (config->resources.cpu_shares < 2 || config->resources.cpu_shares > 262144) {
         fprintf(stderr, "Error: CPU shares must be between 2 and 262144\n");
         return 0;
     }
     
     return 1;
 }
 
 /**
  * Execute the 'run' command
  */
 int cmd_run(container_config_t *config) {
     json_object *args = json_object_new_object();
     int result;
     
     /* Validate config */
     if (!validate_config(config)) {
         return ERR_INVALID_ARGS;
     }
     
     /* Build the arguments */
     json_object_object_add(args, "container_id", 
                           json_object_new_string(config->container_id));
     
     if (config->name) {
         json_object_object_add(args, "name", 
                               json_object_new_string(config->name));
     }
     
     json_object_object_add(args, "image_path", 
                           json_object_new_string(config->image_path));
     
     if (config->command) {
         json_object_object_add(args, "command", 
                               json_object_new_string(config->command));
     }
     
     if (config->arg_count > 0) {
         json_object *args_array = json_object_new_array();
         for (int i = 0; i < config->arg_count; i++) {
             json_object_array_add(args_array, 
                                  json_object_new_string(config->command_args[i]));
         }
         json_object_object_add(args, "command_args", args_array);
     }
     
     /* Resource limits */
     json_object *resources = json_object_new_object();
     json_object_object_add(resources, "cpu_shares", 
                           json_object_new_int(config->resources.cpu_shares));
     json_object_object_add(resources, "memory_limit", 
                           json_object_new_string(config->resources.memory_limit));
     
     if (config->resources.core_count > 0) {
         json_object *cores_array = json_object_new_array();
         for (int i = 0; i < config->resources.core_count; i++) {
             json_object_array_add(cores_array, 
                                  json_object_new_int(config->resources.cpu_cores[i]));
         }
         json_object_object_add(resources, "cpu_cores", cores_array);
     }
     
     if (config->resources.gpu_device) {
         json_object_object_add(resources, "gpu_device", 
                               json_object_new_string(config->resources.gpu_device));
     }
     
     json_object_object_add(args, "resources", resources);
     
     /* Mount points */
     if (config->mount_count > 0) {
         json_object *mounts_array = json_object_new_array();
         for (int i = 0; i < config->mount_count; i++) {
             json_object_array_add(mounts_array, 
                                  json_object_new_string(config->mount_points[i]));
         }
         json_object_object_add(args, "mounts", mounts_array);
     }
     
     /* Environment variables */
     if (config->env_count > 0) {
         json_object *env_array = json_object_new_array();
         for (int i = 0; i < config->env_count; i++) {
             json_object_array_add(env_array, 
                                  json_object_new_string(config->env_vars[i]));
         }
         json_object_object_add(args, "env_vars", env_array);
     }
     
     /* Interactive, TTY, Detach flags */
     json_object_object_add(args, "interactive", 
                           json_object_new_boolean(config->interactive));
     json_object_object_add(args, "tty", 
                           json_object_new_boolean(config->tty));
     json_object_object_add(args, "detach", 
                           json_object_new_boolean(config->detach));
     
     /* Send the command to the daemon */
     result = send_command_to_daemon(CMD_RUN, args);
     
     /* Display container ID if successful and detached */
     if (result == ERR_SUCCESS && config->detach) {
         printf("%s\n", config->container_id);
     }
     
     return result;
 }
 
 /**
  * Execute the 'stop' command
  */
 int cmd_stop(const char *container_id) {
     json_object *args = json_object_new_object();
     
     /* Build the arguments */
     json_object_object_add(args, "container_id", 
                           json_object_new_string(container_id));
     
     /* Send the command to the daemon */
     return send_command_to_daemon(CMD_STOP, args);
 }
 
 /**
  * Execute the 'stats' command
  */
 int cmd_stats(const char *container_id, int watch_mode) {
     json_object *args = json_object_new_object();
     
     /* Build the arguments */
     if (container_id) {
         json_object_object_add(args, "container_id", 
                               json_object_new_string(container_id));
     }
     
     json_object_object_add(args, "watch", 
                           json_object_new_boolean(watch_mode));
     
     /* Send the command to the daemon */
     return send_command_to_daemon(CMD_STATS, args);
 }
 
 /**
  * Execute the 'ps' command
  */
 int cmd_ps(int show_all) {
     json_object *args = json_object_new_object();
     
     /* Build the arguments */
     json_object_object_add(args, "all", json_object_new_boolean(show_all));
     
     /* Send the command to the daemon */
     return send_command_to_daemon(CMD_PS, args);
 }
 
 /**
  * Execute the 'exec' command
  */
 int cmd_exec(const char *container_id, char **cmd, int cmd_len) {
     json_object *args = json_object_new_object();
 
     /* Build the arguments */
     json_object_object_add(args, "container_id", 
                           json_object_new_string(container_id));
     
     json_object *cmd_array = json_object_new_array();
     for (int i = 0; i < cmd_len; i++) {
         json_object_array_add(cmd_array, json_object_new_string(cmd[i]));
     }
     json_object_object_add(args, "command", cmd_array);
     
     /* Send the command to the daemon */
     return send_command_to_daemon(CMD_EXEC, args);
 }
 
 /**
  * Execute the 'logs' command
  */
 int cmd_logs(const char *container_id, int follow) {
     json_object *args = json_object_new_object();
     
     /* Build the arguments */
     json_object_object_add(args, "container_id", 
                           json_object_new_string(container_id));
     json_object_object_add(args, "follow", 
                           json_object_new_boolean(follow));
     
     /* Send the command to the daemon */
     return send_command_to_daemon(CMD_LOGS, args);
 }
 
 /**
  * Execute the 'info' command
  */
 int cmd_info(const char *container_id) {
     json_object *args = json_object_new_object();
     
     /* Build the arguments */
     if (container_id) {
         json_object_object_add(args, "container_id", 
                               json_object_new_string(container_id));
     }
     
     /* Send the command to the daemon */
     return send_command_to_daemon(CMD_INFO, args);
 }
 
 /**
  * Execute the 'limit' command
  */
 int cmd_limit(const char *container_id, resource_limits_t *limits) {
     json_object *args = json_object_new_object();
     
     /* Build the arguments */
     json_object_object_add(args, "container_id", 
                           json_object_new_string(container_id));
     
     json_object *resources = json_object_new_object();
     
     if (limits->cpu_shares > 0) {
         json_object_object_add(resources, "cpu_shares", 
                               json_object_new_int(limits->cpu_shares));
     }
     
     if (limits->memory_limit) {
         json_object_object_add(resources, "memory_limit", 
                               json_object_new_string(limits->memory_limit));
     }
     
     if (limits->core_count > 0) {
         json_object *cores_array = json_object_new_array();
         for (int i = 0; i < limits->core_count; i++) {
             json_object_array_add(cores_array, 
                                  json_object_new_int(limits->cpu_cores[i]));
         }
         json_object_object_add(resources, "cpu_cores", cores_array);
     }
     
     if (limits->gpu_device) {
         json_object_object_add(resources, "gpu_device", 
                               json_object_new_string(limits->gpu_device));
     }
     
     json_object_object_add(args, "resources", resources);
     
     /* Send the command to the daemon */
     return send_command_to_daemon(CMD_LIMIT, args);
 }
 
 /**
  * Main function - entry point for the CLI
  */
 int main(int argc, char **argv) {
     int status = ERR_SUCCESS;
     
     /* Check if any command was provided */
     if (argc < 2) {
         print_usage();
         return ERR_INVALID_ARGS;
     }
     
     /* Process common options */
     if (strcmp(argv[1], "--help") == 0 || strcmp(argv[1], "-h") == 0) {
         print_usage();
         return ERR_SUCCESS;
     }
     
     if (strcmp(argv[1], "--version") == 0 || strcmp(argv[1], "-v") == 0) {
         print_version();
         return ERR_SUCCESS;
     }
     
     /* Connect to the daemon */
     if (connect_to_daemon() < 0) {
         fprintf(stderr, "Error: Could not connect to mini-docker daemon\n");
         fprintf(stderr, "Is the daemon running?\n");
         return ERR_RUNTIME_ERROR;
     }
     
     /* Process command */
     const char *cmd = argv[1];
     
     if (strcmp(cmd, CMD_HELP) == 0) {
         print_usage();
     }
     else if (strcmp(cmd, CMD_VERSION) == 0) {
         print_version();
     }
     else if (strcmp(cmd, CMD_RUN) == 0) {
         if (argc > 2 && (strcmp(argv[2], "--help") == 0 || strcmp(argv[2], "-h") == 0)) {
             print_run_usage();
             return ERR_SUCCESS;
         }
         
         container_config_t config = {0};
         if (parse_run_args(argc - 1, argv + 1, &config) == 0) {
             status = cmd_run(&config);
             free_container_config(&config);
         } else {
             status = ERR_INVALID_ARGS;
         }
     }
     else if (strcmp(cmd, CMD_STOP) == 0) {
         if (argc > 2 && (strcmp(argv[2], "--help") == 0 || strcmp(argv[2], "-h") == 0)) {
             print_stop_usage();
             return ERR_SUCCESS;
         }
         
         if (argc < 3) {
             fprintf(stderr, "Error: Container ID is required\n");
             print_stop_usage();
             status = ERR_INVALID_ARGS;
         } else {
             status = cmd_stop(argv[2]);
         }
     }
     else if (strcmp(cmd, CMD_STATS) == 0) {
         if (argc > 2 && (strcmp(argv[2], "--help") == 0 || strcmp(argv[2], "-h") == 0)) {
             print_stats_usage();
             return ERR_SUCCESS;
         }
         
         int watch_mode = 1;  /* Default to watch mode */
         const char *container_id = NULL;
         
         /* Parse options */
         for (int i = 2; i < argc; i++) {
             if (strcmp(argv[i], "--no-stream") == 0) {
                 watch_mode = 0;
             } else {
                 container_id = argv[i];  /* Assume it's a container ID */
             }
         }
         
         status = cmd_stats(container_id, watch_mode);
     }
     else if (strcmp(cmd, CMD_PS) == 0) {
         if (argc > 2 && (strcmp(argv[2], "--help") == 0 || strcmp(argv[2], "-h") == 0)) {
             print_ps_usage();
             return ERR_SUCCESS;
         }
         
         int show_all = 0;
         
         /* Parse options */
         for (int i = 2; i < argc; i++) {
             if (strcmp(argv[i], "--all") == 0 || strcmp(argv[i], "-a") == 0) {
                 show_all = 1;
             }
         }
         
         status = cmd_ps(show_all);
     }
     else if (strcmp(cmd, CMD_EXEC) == 0) {
         if (argc > 2 && (strcmp(argv[2], "--help") == 0 || strcmp(argv[2], "-h") == 0)) {
             print_exec_usage();
             return ERR_SUCCESS;
         }
         
         if (argc < 4) {
             fprintf(stderr, "Error: Container ID and command are required\n");
             print_exec_usage();
             status = ERR_INVALID_ARGS;
         } else {
             const char *container_id = argv[2];
             char **cmd_args = &argv[3];
             int cmd_len = argc - 3;
             
             status = cmd_exec(container_id, cmd_args, cmd_len);
         }
     }
     else if (strcmp(cmd, CMD_LOGS) == 0) {
         if (argc > 2 && (strcmp(argv[2], "--help") == 0 || strcmp(argv[2], "-h") == 0)) {
             print_logs_usage();
             return ERR_SUCCESS;
         }
         
         if (argc < 3) {
             fprintf(stderr, "Error: Container ID is required\n");
             print_logs_usage();
             status = ERR_INVALID_ARGS;
         } else {
             int follow = 0;
             const char *container_id = NULL;
             
             /* Parse options */
             for (int i = 2; i < argc; i++) {
                 if (strcmp(argv[i], "--follow") == 0 || strcmp(argv[i], "-f") == 0) {
                     follow = 1;
                 } else {
                     container_id = argv[i];  /* Assume it's a container ID */
                 }
             }
             
             if (!container_id) {
                 fprintf(stderr, "Error: Container ID is required\n");
                 print_logs_usage();
                 status = ERR_INVALID_ARGS;
             } else {
                 status = cmd_logs(container_id, follow);
             }
         }
     }
     else if (strcmp(cmd, CMD_INFO) == 0) {
         if (argc > 2 && (strcmp(argv[2], "--help") == 0 || strcmp(argv[2], "-h") == 0)) {
             print_info_usage();
             return ERR_SUCCESS;
         }
         
         const char *container_id = NULL;
         
         /* Parse options */
         if (argc >= 3) {
             container_id = argv[2];
         }
         
         status = cmd_info(container_id);
     }
     else if (strcmp(cmd, CMD_LIMIT) == 0) {
         if (argc > 2 && (strcmp(argv[2], "--help") == 0 || strcmp(argv[2], "-h") == 0)) {
             print_limit_usage();
             return ERR_SUCCESS;
         }
         
         if (argc < 3) {
             fprintf(stderr, "Error: Container ID is required\n");
             print_limit_usage();
             status = ERR_INVALID_ARGS;
         } else {
             const char *container_id = argv[2];
             resource_limits_t limits = {0};
             int option;
             int option_index = 0;
             
             /* Shift arguments to parse options after container ID */
             optind = 3;
             
             static struct option long_options[] = {
                 {"cpu-shares",  required_argument, 0, 'c'},
                 {"memory",      required_argument, 0, 'm'},
                 {"cpuset-cpus", required_argument, 0, 's'},
                 {"gpuset-gpus", required_argument, 0, 'g'},
                 {0, 0, 0, 0}
             };
             
             /* Parse options */
             while ((option = getopt_long(argc, argv, "c:m:s:g:",
                                         long_options, &option_index)) != -1) {
                 switch (option) {
                     case 'c':
                         limits.cpu_shares = atoi(optarg);
                         break;
                     case 'm':
                         limits.memory_limit = strdup(optarg);
                         break;
                     case 's':
                         limits.core_count = 
                             parse_cpuset(optarg, limits.cpu_cores, 16);
                         break;
                     case 'g':
                         limits.gpu_device = strdup(optarg);
                         break;
                     default:
                         print_limit_usage();
                         status = ERR_INVALID_ARGS;
                         goto cleanup;
                 }
             }
             
             /* Make sure at least one limit was specified */
             if (limits.cpu_shares == 0 && !limits.memory_limit && 
                 limits.core_count == 0 && !limits.gpu_device) {
                 fprintf(stderr, "Error: At least one resource limit must be specified\n");
                 print_limit_usage();
                 status = ERR_INVALID_ARGS;
                 goto cleanup;
             }
             
             status = cmd_limit(container_id, &limits);
             
 cleanup:
             free(limits.memory_limit);
             free(limits.gpu_device);
         }
     }
     else {
         fprintf(stderr, "Error: Unknown command: %s\n", cmd);
         print_usage();
         status = ERR_INVALID_ARGS;
     }
     
     /* Close connection to daemon */
     close_daemon_connection();
     
     return status;
 }