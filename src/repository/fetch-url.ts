import { sprintf } from "@std/fmt/printf";
import type { DiscoverFilter, InvestorId } from "📚/repository/types.ts";

type URL = string;

/** Disk base storage for repository */
export class FetchURL {
  private readonly site = "https://www.etoro.com";
  private readonly uuid = crypto.randomUUID();

  public discover(filter: DiscoverFilter): URL {
    const urlTemplate = "/sapi/rankings/rankings?client_request_id=%s&%s";
    const filter_template =
      `blocked=false&bonusonly=false&copyblock=false&istestaccount=false&optin=true&page=1&period=OneYearAgo&verified=true&isfund=false&copiersmin=1&dailyddmin=-%d&gainmin=11&gainmax=350&maxmonthlyriskscoremax=%d&maxmonthlyriskscoremin=2&pagesize=70&profitablemonthspctmin=60&sort=-weeklydd&weeklyddmin=-%d&activeweeksmin=12&lastactivitymax=14`;
    const options: string = sprintf(
      filter_template,
      filter.daily,
      filter.risk,
      filter.weekly,
    );
    const url: string = this.site + sprintf(urlTemplate, this.uuid, options);
    return url;
  }

  public chart(investor: InvestorId): URL {
    const urlTemplate =
      "/sapi/trade-data-real/chart/public/%s/oneYearAgo/1?client_request_id=%s";
    // "/sapi/userstats/CopySim/Username/%s/OneYearAgo?client_request_id=%s";
    const url: string = this.site +
      sprintf(urlTemplate, investor.UserName, this.uuid);
    return url;
  }

  public portfolio(investor: InvestorId): URL {
    const urlTemplate =
      "/sapi/trade-data-real/live/public/portfolios?cid=%d&client_request_id=%s";
    const url: string = this.site +
      sprintf(urlTemplate, investor.CustomerId, this.uuid);
    return url;
  }

  public stats(investor: InvestorId): URL {
    const urlTemplate =
      "/sapi/rankings/cid/%d/rankings?Period=OneYearAgo&client_request_id=%s";
    const url: string = this.site +
      sprintf(urlTemplate, investor.CustomerId, this.uuid);
    return url;
  }
}
