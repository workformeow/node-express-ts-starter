import { Router } from 'express'
import { validateRequest } from '@/core/http'
import { todoSchema } from './todo.schema'
import type { TodoController } from './todo.controller'

export const createTodoRouter = (todoController: TodoController): Router => {
  const router = Router()

  router.get('/', todoController.list)
  router.post('/', validateRequest(todoSchema.create), todoController.create)
  router.get('/:id', validateRequest(todoSchema.byId), todoController.getById)
  router.patch('/:id/toggle', validateRequest(todoSchema.byId), todoController.toggle)
  router.delete('/:id', validateRequest(todoSchema.byId), todoController.remove)

  return router
}
