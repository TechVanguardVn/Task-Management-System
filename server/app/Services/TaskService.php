<?php

namespace App\Services;

use App\Models\Task;
use App\Repositories\TaskRepository;
use Illuminate\Database\Eloquent\Collection;

class TaskService
{
    public function __construct(
        protected TaskRepository $taskRepo
    ) {}

    public function getTasksForUser(int $userId): Collection
    {
        return $this->taskRepo->getByUserId($userId);
    }

    public function createTask(int $userId, array $data): Task
    {
        return $this->taskRepo->createForUser($userId, $data);
    }

    public function getTaskById(Task $task, int $userId): Task
    {
        $this->authorizeTaskAccess($task, $userId);

        return $task;
    }

    public function updateTask(Task $task, int $userId, array $data): Task
    {
        $this->authorizeTaskAccess($task, $userId);

        return $this->taskRepo->update($task, $data);
    }

    public function deleteTask(Task $task, int $userId): bool
    {
        $this->authorizeTaskAccess($task, $userId);

        return $this->taskRepo->delete($task);
    }

    protected function authorizeTaskAccess(Task $task, int $userId): void
    {
        if ((int) $task->user_id !== $userId) {
            abort(403, 'Bạn không có quyền truy cập công việc này.');
        }
    }
}
