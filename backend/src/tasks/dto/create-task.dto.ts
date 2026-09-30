import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, maxLength } from "class-validator";
import { TaskPriority } from "src/generated/prisma/enums";


export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @IsOptional()
    @IsDateString()
    dueDate?: string;
}