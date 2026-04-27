import { Tick, Timeline } from "📚/tick/mod.ts";
import { Community } from "📚/community/mod.ts";

/** On which tick will trading happen */
export const tradingTick = async (
  community: Community,
  weekday: number,
): Promise<Tick> => {
  // Last tick of community
  const communityEnd: Tick = await community.end();

  // Which day of week is the last tick?
  const timeline: Timeline = await community.timeline();
  const communityEndWeekday: number = timeline.weekday(communityEnd);

  // Number of days to subtract from repo end to get to desired weekday
  const daysToSubtract: number = (communityEndWeekday - weekday + 7) % 7;

  // Which tick is the last falling on the specified weekday?
  const tradingTick: Tick = communityEnd - daysToSubtract;
  return tradingTick;
};
