import "reflect-metadata";
import { container } from "./inversify.config";

/**
 * Helper function to get the IoC container
 * This ensures reflect-metadata is loaded before using the container
 */
export function getContainer() {
  return container;
}
