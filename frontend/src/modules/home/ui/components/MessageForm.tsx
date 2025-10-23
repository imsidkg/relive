import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { trpc } from "@/trpc";
import { useQueryClient } from "@tanstack/react-query";

interface props {
  projectId: string;
}

const formSchema = z.object({
  value: z
    .string()
    .min(1, { message: "Value is required" })
    .max(1000, { message: "Value is too long" }),
});

export const MessageForm = ({ projectId }: props) => {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: "",
    },
    mode: "onChange",
  });

  const sendMessageMutation = trpc.sendMessage.useMutation({
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({
        queryKey: [["getMessages"]],
      });
    },
    onError: (error) => {
      console.error("Error sending message:", error);
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await sendMessageMutation.mutateAsync({
      message: values.value,
      projectId,
    });
  };

  const isPending = sendMessageMutation.isPending;
  const isButtonDisabled = isPending || !form.formState.isValid;
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "relative border p-4 pt-1 rounded-xl bg-sidebar transition-all",
          isFocused && "shadow-xs"
        )}
      >
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <TextareaAutosize
              {...field}
              disabled={isPending}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              minRows={2}
              maxRows={8}
              className="pt-4 resize-none border-none w-full outline-none bg-transparent"
              placeholder="What would you like to build?"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  form.handleSubmit(onSubmit)(e);
                }
              }}
            />
          )}
        />

        <div className="flex gap-x-2 items-end justify-between pt-2">
          <div className="text-[10px] text-muted-foreground font-mono">
            <kbd className="ml-auto pointer-events-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text=[10px] font-medium ">
              <span>&#8984;</span>Enter
            </kbd>
            &nbsp;to Submit
          </div>

          <Button
            disabled={isButtonDisabled}
            className={cn(
              "size-8 rounded-full",
              isButtonDisabled && "bg-muted-foreground border"
            )}
          >
            {isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <ArrowUpIcon />
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};