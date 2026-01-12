import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/trpc";
import { PROJECT_TEMPLATES } from "../../constants";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

const formScema = z.object({
  value: z.string().min(1, { message: "Value is required" }),
});

const ProjectForm = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const form = useForm<z.infer<typeof formScema>>({
    resolver: zodResolver(formScema),
    defaultValues: {
      value: "",
    },
  });

  useEffect(() => {
    if (user) {
      const pendingPrompt = localStorage.getItem("pendingPrompt");
      if (pendingPrompt) {
        form.setValue("value", pendingPrompt, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        localStorage.removeItem("pendingPrompt");
      }
    }
  }, [user, form]);

  const sendMessageMutation = trpc.sendMessage.useMutation({
    onSuccess: (data) => {
      console.log("✅ Send message success. Navigating with:", data);
      form.reset();
      navigate(`/project/${data.projectId}`);
    },
    onError: () => {
      toast.error("Message sending unsuccessful");
    },
  });

  const createProjectMutation = trpc.createProject.useMutation({
    onSuccess: (newProject) => {
      console.log("✅ Create project success:", newProject);
      toast.success(`Project "${newProject.name}" created!`);
      sendMessageMutation.mutate({
        message: form.getValues("value"),
        projectId: newProject.id,
      });
    },
    onError: (error) => {
      toast.error("Failed to create project. " + error.message);
    },
  });

  const onSubmit = async (values: z.infer<typeof formScema>) => {
    console.log("Form submitted. User object is:", user);

    if (!user) {
      localStorage.setItem("pendingPrompt", values.value);
      navigate("/sign-in");
      return;
    }

    console.log("User is present. Calling createProjectMutation...");
    createProjectMutation.mutate({
      name: values.value.substring(0, 40),
      userId: user.id,
    });
  };

  const onSelect = (value: string) => {
    form.setValue("value", value, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });
  };

  const isPending =
    createProjectMutation.isPending || sendMessageMutation.isPending;
  const isButtonDisbled = isPending || !form.formState.isValid;
  const [isFocuesd, setIsFocused] = useState(false);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "relative border p-4 pt-1 rounded-xl bg-sidebar transition-all",
          isFocuesd && "shadow-xs"
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
              placeholder="what would you like to build?"
              onKeyDown={(e: any) => {
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
            <kbd
              className="ml-auto pointer-events-auto inline-flex h-5 select-none items-center
       gap-1 rounded border bg-muted  px-1.5 font-mono text=[10px] font-medium "
            >
              <span>&#8984;</span>Enter
            </kbd>
            &nbsp;to Submit
          </div>

          <Button
            disabled={isButtonDisbled}
            className={cn(
              "size-8 rounded-full",
              isButtonDisbled && "bg-muted-foreground border"
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

      <div className="flex-wrap justify-center gap-2 hidden md:flex max-w-3xl">
        {PROJECT_TEMPLATES.map((template: any) => (
          <Button
            key={template.title}
            variant="outline"
            size="sm"
            className="bg-white dark:bg-sidebar"
            onClick={() => onSelect(template.prompt)}
          >
            {template.emoji} {template.title}
          </Button>
        ))}
      </div>
    </Form>
  );
};

export default ProjectForm;
