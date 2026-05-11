export type SiteLink = {
  id?: string;
  name: string;
  desc: string;
  url: string;
  icon?: string;
};

export type DirectTool = {
  name: string;
  url: string;
  iconClass: string;
  color: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  tabs: string[];
  groups: Array<{
    name: string;
    mid: string;
    tools: SiteLink[];
  }>;
  tools: SiteLink[];
};

export type ToolsData = {
  crawledAt: string;
  site: {
    title: string;
    footer: string;
  };
  hotSites: SiteLink[];
  directTools: DirectTool[];
  categories: Category[];
};
