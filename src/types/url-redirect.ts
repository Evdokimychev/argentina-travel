export type UrlRedirectStatusCode = 301 | 302 | 307 | 308;

export type UrlRedirect = {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: UrlRedirectStatusCode;
  enabled: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type UrlRedirectInput = {
  fromPath: string;
  toPath: string;
  statusCode?: UrlRedirectStatusCode;
  enabled?: boolean;
  note?: string;
};

export const URL_REDIRECT_STATUS_CODES: UrlRedirectStatusCode[] = [301, 302, 307, 308];
