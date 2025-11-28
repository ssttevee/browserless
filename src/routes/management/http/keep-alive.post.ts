import {
  APITags,
  BrowserlessRoutes,
  HTTPManagementRoutes,
  HTTPRoute,
  Logger,
  Methods,
  Request,
  SystemQueryParameters,
  contentTypes,
  getFinalPathSegment,
  jsonResponse,
} from '@browserless.io/browserless';
import { ServerResponse } from 'http';

export interface BodySchema {
  /**
   * The duration in milliseconds to keep the browser session alive
   * after all clients disconnect.
   */
  timeout: number;
}

export interface ResponseSchema {
  /**
   * The browser session ID
   */
  browserId: string;

  /**
   * The WebSocket URL that can be used to reconnect to the session.
   * Connect to this URL before the timeout expires to continue using the session.
   */
  browserWSEndpoint: string | null;
}

export interface QuerySchema extends SystemQueryParameters {
  token?: string;
}

export default class KeepAlivePostRoute extends HTTPRoute {
  name = BrowserlessRoutes.KeepAlivePostRoute;
  accepts = [contentTypes.json];
  auth = true;
  browser = null;
  concurrency = false;
  contentTypes = [contentTypes.json];
  description = `Set the keep-alive time for a browser session. When set, the browser will remain alive for the specified timeout duration after all clients disconnect. Returns a reconnection URL that can be used to reconnect to the session before the timeout expires.`;
  method = Methods.post;
  path = HTTPManagementRoutes.keepAlive;
  tags = [APITags.management];

  async handler(
    req: Request,
    res: ServerResponse,
    logger: Logger,
  ): Promise<void> {
    const target = getFinalPathSegment(req.parsed.pathname)!;
    const body = req.body as BodySchema;

    if (typeof body?.timeout !== 'number' || body.timeout <= 0) {
      return jsonResponse(res, 400, {
        error: 'Invalid timeout value. Must be a positive number in milliseconds.',
      });
    }

    const browserManager = this.browserManager();
    logger.info(`Setting keep-alive for session "${target}" to ${body.timeout}ms`);

    const result = await browserManager.setSessionKeepAlive(target, body.timeout);
    return jsonResponse(res, 200, result);
  }
}
