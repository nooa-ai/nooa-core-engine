/**
 * Presentation Protocol: Process Exit Handler
 *
 * Handles process termination with exit codes.
 * This is a presentation concern - CLI output/termination.
 *
 * ISP: Single responsibility - only handles exit
 */

export interface IProcessExitHandler {
  /**
   * Exits the process with given code
   * @param code - Exit code (0 = success, non-zero = error)
   */
  exit(code: number): void;
}
