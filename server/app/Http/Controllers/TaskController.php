<?php

namespace App\Http\Controllers;

use App\Docs\TaskDoc;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    use TaskDoc;

    public function __construct(
        protected TaskService $taskService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $tasks = $this->taskService->getTasksForUser((int) $request->user()->id);

        return response()->json([
            'data' => TaskResource::collection($tasks),
        ]);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $task = $this->taskService->createTask((int) $request->user()->id, $request->validated());

        return response()->json([
            'message' => 'Tạo công việc thành công',
            'data' => new TaskResource($task),
        ], 201);
    }

    public function show(Task $task): JsonResponse
    {
        $task = $this->taskService->getTaskById($task, (int) auth()->id());

        return response()->json([
            'data' => new TaskResource($task),
        ]);
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $task = $this->taskService->updateTask($task, (int) auth()->id(), $request->validated());

        return response()->json([
            'message' => 'Cập nhật công việc thành công',
            'data' => new TaskResource($task),
        ]);
    }

    public function destroy(Task $task): JsonResponse
    {
        $this->taskService->deleteTask($task, (int) auth()->id());

        return response()->json([
            'message' => 'Xóa công việc thành công',
        ]);
    }
}
