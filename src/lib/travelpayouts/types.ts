export type TravelpayoutsLinkInput = {
  url: string;
  subId?: string;
};

export type TravelpayoutsLinkResult = {
  url: string;
  code: "success" | "failed" | string;
  partnerUrl: string | null;
  message?: string;
};

export type TravelpayoutsCreateLinksRequest = {
  trs: number;
  marker: number;
  shorten: boolean;
  links: Array<{
    url: string;
    sub_id?: string;
  }>;
};

export type TravelpayoutsCreateLinksResponse = {
  code: string;
  status: number;
  result?: {
    trs: number;
    marker: number;
    shorten: boolean;
    links: Array<{
      url: string;
      code: string;
      partner_url?: string;
      message?: string;
    }>;
  };
  error?: string;
};
