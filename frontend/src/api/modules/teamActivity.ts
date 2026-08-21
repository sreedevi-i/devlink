import { api } from '../client';

export type TeamActivityType =
  | 'member_joined'
  | 'member_left'
  | 'role_updated'
  | 'project_updated'
  | 'milestone_completed'
  | 'new_discussion'
  | 'file_uploaded';

export interface TeamActivityItem {
  id: string;
  project_id: number;
  activity_type: TeamActivityType;
  title: string;
  description?: string;
  actor_name: string;
  actor_avatar?: string;
  metadata_info?: Record<string, any>;
  created_at: string;
}

export interface TeamActivityTimelineResponse {
  project_id: number;
  items: TeamActivityItem[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export const getTeamActivityTimeline = async (
  projectId: number,
  page: number = 1,
  limit: number = 10,
  activityType?: string
): Promise<TeamActivityTimelineResponse> => {
  let url = `/projects/${projectId}/activity-timeline?page=${page}&limit=${limit}`;
  if (activityType) {
    url += `&activity_type=${activityType}`;
  }
  return await api.get<TeamActivityTimelineResponse>(url);
};
