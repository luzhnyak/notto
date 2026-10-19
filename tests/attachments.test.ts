import { AttachmentService, webUrl } from "../src/services/AttachmentService";
import { AttachmentRepository } from "../src/domain/repositories";
import { OperationGate } from "../src/services/OperationGate";
test("URLs only allow web protocols", () => {
  expect(webUrl(" https://example.com ")).toBe("https://example.com/");
  for (const v of ["javascript:alert(1)", "file:///x", "not a url"])
    expect(() => webUrl(v)).toThrow();
});
test("failed attachment insert removes copied file", async () => {
  const removed: string[] = [];
  const repo: AttachmentRepository = {
    list: async () => [],
    create: async () => {
      throw new Error("database full");
    },
    remove: async () => {},
    rename: async () => {},
  };
  const service = new AttachmentService(
    repo,
    {
      copy: async () => ({ path: "attachments/a.jpg", size: 7 }),
      remove: async (p) => {
        removed.push(p);
      },
      uri: async (p) => p,
    },
    new OperationGate(),
  );
  await expect(
    service.addFile(1, "image", "temp://a", "a.jpg", "image/jpeg"),
  ).rejects.toThrow("database full");
  expect(removed).toEqual(["attachments/a.jpg"]);
});
test("operation gate serializes changes and continues after failure", async () => {
  const gate = new OperationGate();
  const order: number[] = [];
  const a = gate.run(async () => {
    order.push(1);
    await Promise.resolve();
    order.push(2);
    throw Error("failed");
  });
  const b = gate.run(async () => {
    order.push(3);
  });
  await expect(a).rejects.toThrow();
  await b;
  expect(order).toEqual([1, 2, 3]);
});
