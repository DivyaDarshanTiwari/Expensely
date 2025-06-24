//USED ZOD for input validation for the addExpense
const z = require("zod");

const expenseSchema = z.object({
  userId: z.number(),
  amount: z.number().positive("Amount must be greater than 0"),
  category: z
    .string()
    .min(1, "Category cannot be empty")
    .nonempty("Enter the category and it should be a string"),
  description: z.string().optional(),
});

module.exports = expenseSchema;
