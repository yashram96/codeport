export interface Repository {
  id: string;
  name: string;
  url: string;
}

export interface Host {
  id: string;
  name: string;
  scripts: string[];
}

export interface Script {
  id: string;
  name: string;
  path: string;
}

export interface Settings {
  repositories: Repository[];
  hosts: Host[];
  scripts: Script[];
}

export interface DeploymentEvent {
  id: string;
  timestamp: string;
  repository: string;
  status: 'Pending' | 'Success' | 'Failed';
  logs: string[];
}