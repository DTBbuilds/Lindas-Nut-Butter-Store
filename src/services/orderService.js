import apiService from './apiService';
import { API_ENDPOINTS } from '../config/api';

/**
 * Creates a new order.
 * @param {object} orderData - The data for the new order.
 * @returns {Promise<object>} The created order.
 */
export const createOrder = async (orderData) => {
  try {
    const response = await apiService.post(API_ENDPOINTS.ORDERS, orderData);
    return response;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Retrieves the status of a specific order.
 * @param {string} orderId - The ID of the order to check.
 * @returns {Promise<object>} The order status.
 */
export const getOrderStatus = async (orderId) => {
  try {
    const response = await apiService.get(API_ENDPOINTS.ORDER(orderId));
    return response;
  } catch (error) {
    console.error(`Error fetching status for order ${orderId}:`, error);
    throw error;
  }
};
