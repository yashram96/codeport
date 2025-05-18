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

export interface Settings {
  repositories: Repository[];
  hosts: Host[];
  scripts: Script[];
}

export interface Script {
  id: string;
  name: string;
  path: string;
}

export interface DeploymentArgument {
  key: string;
  value: string;
}

export interface DeploymentEvent {
  id: string;
  name: string;
  timestamp: string;
  repository: string;
  hostId: string;
  status: string;
  logs: string[];
  arguments?: DeploymentArgument[];
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
}