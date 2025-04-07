"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ExampleComponent() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Ejemplo de Shadcn/ui</CardTitle>
        <CardDescription>
          Aquí puedes ver algunos componentes en acción.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" placeholder="Ingresa tu nombre" />
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" placeholder="Ingresa tu email" type="email" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancelar</Button>
        <Button>Guardar</Button>
      </CardFooter>
    </Card>
  )
} 