export interface IDockerConfig {
  auths: {
    [key: string]: {
      auth: string;
    };
  };
}
