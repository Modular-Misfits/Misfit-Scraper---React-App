export type Topic = {
  topicCode: string;
  topicTitle: string;
  phaseHierarchy: string;
  component: string;
  program: string;
  topicStatus: string;
  solicitationTitle: string;
  topicManagers?: {
    name?: string;
    email?: string;
    phone?: string;
  }[];
};