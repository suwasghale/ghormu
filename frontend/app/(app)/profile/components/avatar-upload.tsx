"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Camera } from "lucide-react"

type Props = {
  image?: string | null
  fullName: string
}

export default function AvatarUpload({
  image,
  fullName,
}: Props) {
  return (
    <Card>

      <CardHeader>

        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          <span>Profile Picture</span>
        </CardTitle>

        <CardDescription>
          Update your profile picture.
        </CardDescription>

      </CardHeader>

      <CardContent className="flex flex-col items-center gap-6">

        <Avatar className="h-28 w-28">

          <AvatarImage src={image ?? ""} />

          <AvatarFallback>
            {fullName
              .split(" ")
              .map((word) => word[0])
              .join("")
              .slice(0, 2)}
          </AvatarFallback>

        </Avatar>

        <div className="flex gap-3">

          <Button type="button">
            Upload New
          </Button>

          <Button
            type="button"
            variant="outline"
          >
            Remove
          </Button>

        </div>

        <p className="text-xs text-muted-foreground">
          JPG, PNG • Maximum 5 MB
        </p>

      </CardContent>

    </Card>
  )
}