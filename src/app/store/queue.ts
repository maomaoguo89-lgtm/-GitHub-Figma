type Task<T> = () => Promise<T>;

class TaskQueue {
  private queue: (() => Promise<void>)[] = [];
  private isProcessing: boolean = false;

  async add<T>(task: Task<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
      }
    }

    this.isProcessing = false;
  }
  
  get length() {
    return this.queue.length;
  }
  
  clear() {
    this.queue = [];
  }
}

export const globalTaskQueue = new TaskQueue();
