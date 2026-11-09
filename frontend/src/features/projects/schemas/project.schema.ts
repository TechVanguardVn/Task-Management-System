import { z } from "zod";

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const projectFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên dự án.")
      .max(120, "Tên dự án tối đa 120 ký tự."),
    description: z
      .string()
      .trim()
      .max(2000, "Mô tả dự án tối đa 2000 ký tự."),
    color: z
      .string()
      .trim()
      .refine((val) => HEX_COLOR_REGEX.test(val), "Mã màu không hợp lệ."),
    status: z.enum(["ACTIVE", "ARCHIVED"]),
    startDate: z
      .string()
      .trim()
      .refine(
        (val) => val === "" || DATE_ONLY_REGEX.test(val),
        "Ngày bắt đầu không hợp lệ.",
      ),
    dueDate: z
      .string()
      .trim()
      .refine(
        (val) => val === "" || DATE_ONLY_REGEX.test(val),
        "Hạn hoàn thành không hợp lệ.",
      ),
  })
  .refine(
    (data) => {
      if (data.startDate && data.dueDate) {
        return data.dueDate >= data.startDate;
      }
      return true;
    },
    {
      message: "Hạn hoàn thành phải lớn hơn hoặc bằng ngày bắt đầu.",
      path: ["dueDate"],
    },
  );

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
