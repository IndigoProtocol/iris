import { BaseService } from './BaseService';
import { BaseJob } from '../jobs/BaseJob';
import Queue from 'queue-promise';

export class QueueService extends BaseService {
  private queue: Queue;

  constructor() {
    super();

    this.queue = new Queue({
      concurrent: 50,
      interval: 0,
      start: false,
    });
  }

  get size(): number {
    return this.queue.size;
  }

  boot(): Promise<any> {
    return Promise.resolve();
  }

  dispatch(job: BaseJob): void {
    this.queue.enqueue(() => job.handle());
  }

  async settle(): Promise<any> {
    while (this.queue.shouldRun) {
      await this.queue.dequeue();
    }
  }
}
