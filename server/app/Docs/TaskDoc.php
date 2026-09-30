<?php

namespace App\Docs;

use OpenApi\Attributes as OA;

#[OA\Tag(name: "Task", description: "Quản lý công việc của người dùng")]
trait TaskDoc
{
    #[OA\Get(
        path: "/tasks",
        summary: "Danh sách công việc của người dùng",
        tags: ["Task"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Lấy danh sách công việc thành công",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: "data",
                            type: "array",
                            items: new OA\Items(ref: "#/components/schemas/TaskItem")
                        )
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated")
        ]
    )]
    public function indexDoc() {}

    #[OA\Post(
        path: "/tasks",
        summary: "Tạo mới công việc",
        tags: ["Task"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "title", type: "string", example: "Hoàn thiện dashboard"),
                    new OA\Property(property: "description", type: "string", example: "Tạo giao diện task và hoàn thiện CRUD"),
                    new OA\Property(property: "status", type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"], example: "TODO"),
                    new OA\Property(property: "priority", type: "string", enum: ["LOW", "MEDIUM", "HIGH"], example: "HIGH"),
                    new OA\Property(property: "due_date", type: "string", format: "date", example: "2026-10-10")
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Tạo công việc thành công",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Tạo công việc thành công"),
                        new OA\Property(property: "data", ref: "#/components/schemas/TaskItem")
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Dữ liệu không hợp lệ"),
            new OA\Response(response: 401, description: "Unauthenticated")
        ]
    )]
    public function storeDoc() {}

    #[OA\Get(
        path: "/tasks/{id}",
        summary: "Lấy chi tiết công việc theo ID",
        tags: ["Task"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID công việc",
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Thông tin công việc",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "data", ref: "#/components/schemas/TaskItem")
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 403, description: "Không có quyền truy cập")
        ]
    )]
    public function showDoc() {}

    #[OA\Put(
        path: "/tasks/{id}",
        summary: "Cập nhật công việc",
        tags: ["Task"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID công việc",
                schema: new OA\Schema(type: "integer")
            )
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "title", type: "string", example: "Hoàn thiện dashboard"),
                    new OA\Property(property: "description", type: "string", nullable: true, example: "Cập nhật giao diện và validation"),
                    new OA\Property(property: "status", type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"], example: "IN_PROGRESS"),
                    new OA\Property(property: "priority", type: "string", enum: ["LOW", "MEDIUM", "HIGH"], example: "MEDIUM"),
                    new OA\Property(property: "due_date", type: "string", format: "date", example: "2026-10-12")
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Cập nhật công việc thành công",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Cập nhật công việc thành công"),
                        new OA\Property(property: "data", ref: "#/components/schemas/TaskItem")
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Dữ liệu không hợp lệ"),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 403, description: "Không có quyền truy cập")
        ]
    )]
    public function updateDoc() {}

    #[OA\Delete(
        path: "/tasks/{id}",
        summary: "Xóa công việc",
        tags: ["Task"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID công việc cần xoá",
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Xóa công việc thành công",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Xóa công việc thành công")
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 403, description: "Không có quyền truy cập")
        ]
    )]
    public function destroyDoc() {}
}

#[OA\Schema(
    schema: "TaskItem",
    title: "Task Item",
    required: ["id", "title", "status", "priority"],
    properties: [
        new OA\Property(property: "id", type: "integer", example: 1),
        new OA\Property(property: "title", type: "string", example: "Hoàn thiện dashboard"),
        new OA\Property(property: "description", type: "string", nullable: true, example: "Tạo giao diện task và hoàn thiện CRUD"),
        new OA\Property(property: "status", type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"], example: "TODO"),
        new OA\Property(property: "priority", type: "string", enum: ["LOW", "MEDIUM", "HIGH"], example: "HIGH"),
        new OA\Property(property: "due_date", type: "string", format: "date", nullable: true, example: "2026-10-10"),
        new OA\Property(property: "created_at", type: "string", format: "date-time", example: "2026-09-29 10:00:00"),
        new OA\Property(property: "updated_at", type: "string", format: "date-time", example: "2026-09-29 10:05:00")
    ]
)]
class TaskSchema {}
