import { HttpStatus, SUCCESS } from '@/shared/consts'
import { createResponse } from '@/shared/utils'
import type { Todo } from './todo.entity'
import type { CreateTodoInput, TodoIdParams } from './todo.schema'
import type { TodoService } from './todo.service'
import type { Request, Response } from 'express'

export const createTodoController = (todoService: TodoService) => {
  const list = async (_req: Request, res: Response) => {
    const data: Todo[] = await todoService.list()
    const response = createResponse(SUCCESS.list('todos'), data)
    res.status(HttpStatus.OK).json(response)
  }

  const getById = async (req: Request<TodoIdParams>, res: Response) => {
    const data: Todo = await todoService.getById(req.params.id)
    const response = createResponse(SUCCESS.get('todo'), data)
    res.status(HttpStatus.OK).json(response)
  }

  const create = async (req: Request<unknown, unknown, CreateTodoInput>, res: Response) => {
    const data: Todo = await todoService.create(req.body)
    const response = createResponse(SUCCESS.create('todo'), data)
    res.status(HttpStatus.CREATED).json(response)
  }

  const toggle = async (req: Request<TodoIdParams>, res: Response) => {
    const data: Todo = await todoService.toggle(req.params.id)
    const response = createResponse(SUCCESS.update('todo'), data)
    res.status(HttpStatus.OK).json(response)
  }

  const remove = async (req: Request<TodoIdParams>, res: Response) => {
    await todoService.remove(req.params.id)
    const response = createResponse(SUCCESS.delete('todo'))
    res.status(HttpStatus.OK).json(response)
  }

  return { list, getById, create, toggle, remove }
}

export type TodoController = ReturnType<typeof createTodoController>
