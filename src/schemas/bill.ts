import { z } from 'zod';

// Schema for individual bill items
export const billItemSchema = z.object({
  id: z.number().describe('Unique identifier for the bill item'),
  name: z.string().describe('Name of the bill item'),
  cost: z.number().describe('Cost of the bill item'),
  type: z.enum(['food', 'drink', 'dessert']).describe('Type of the bill item (food, drink, or dessert)')
});

// Schema for the entire bill
export const billSchema = z.object({
  items: z.array(billItemSchema).describe('List of items on the bill'),
  tax: z.number().describe('Tax amount on the bill'),
  total: z.number().describe('Total amount including items and tax'),
  currency: z.string().describe('Currency of the bill (e.g., USD, INR)')
});

// Schema for consumption mapping
export const consumptionItemSchema = z.object({
  itemId: z.number().describe('ID of the consumed item'),
  proportion: z.number().describe('Proportion of the item consumed (e.g., 0.5 for half)')
});

export const userConsumptionSchema = z.object({
  userId: z.number().describe('ID of the user'),
  consumption: z.array(consumptionItemSchema).describe('List of items consumed by this user')
});

// Schema for user totals
export const userTotalSchema = z.object({
  userId: z.number().describe('ID of the user'),
  total: z.number().describe('Total amount to be paid by this user')
}); 