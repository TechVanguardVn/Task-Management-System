<?php

namespace App\Repositories;

use App\Models\Task;
use Illuminate\Database\Eloquent\Collection;

class TaskRepository
{
    public function __construct(
        protected Task $model
    ) {}

    public function getByUserId(int $userId): Collection
    {
        return $this->model
            ->where('user_id', $userId)
            ->latest()
            ->get();
    }

    public function createForUser(int $userId, array $data): Task
    {
        return $this->model->create([
            ...$data,
            'user_id' => $userId,
        ]);
    }

    public function update(Task $task, array $data): Task
    {
        $task->update($data);

        return $task->fresh();
    }

    public function delete(Task $task): bool
    {
        return $task->delete();
    }
}
