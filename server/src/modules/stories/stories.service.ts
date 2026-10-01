import { Story, StoryType } from '../../models/Story.js';
import { ExplorationLog } from '../../models/ExplorationLog.js';
import { Child } from '../../models/Child.js';
import { Types } from 'mongoose';

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export class StoriesService {
  static async getStories(filter: { type?: StoryType; ageGroup?: string; search?: string }) {
    const query: any = {};

    if (filter.type) {
      query.type = filter.type;
    }

    if (filter.ageGroup) {
      query.ageGroups = filter.ageGroup;
    }

    if (filter.search && filter.search.trim()) {
      const safeSearch = escapeRegex(filter.search.trim().slice(0, 50));
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    return Story.find(query).sort({ createdAt: -1 }).limit(100);
  }

  static async getStoryById(id: string) {
    const story = await Story.findById(id);
    if (!story) {
      throw { statusCode: 404, message: 'Không tìm thấy câu chuyện' };
    }
    return story;
  }

  static async markExplored(storyId: string, childId: string, parentId: string) {
    const child = await Child.findOne({ _id: childId, parentId });
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ của bé' };
    }

    const story = await Story.findById(storyId);
    if (!story) {
      throw { statusCode: 404, message: 'Không tìm thấy câu chuyện' };
    }

    try {
      const log = await ExplorationLog.findOneAndUpdate(
        { childId: child._id, kind: 'story', refId: story._id },
        { $setOnInsert: { createdAt: new Date() } },
        { upsert: true, new: true }
      );
      return log;
    } catch (err: any) {
      if (err.code === 11000) {
        return ExplorationLog.findOne({ childId: child._id, kind: 'story', refId: story._id });
      }
      throw err;
    }
  }
}
