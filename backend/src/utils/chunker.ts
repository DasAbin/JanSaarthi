export class Chunker {
  constructor(private maxChars: number = 1500) {}

  chunk(text: string): string[] {
    const chunks: string[] = [];
    let current = "";

    for (const line of text.split(/\r?\n/)) {
      if ((current + "\n" + line).length > this.maxChars) {
        if (current.trim().length > 0) {
          chunks.push(current.trim());
        }
        current = line;
      } else {
        current += (current ? "\n" : "") + line;
      }
    }

    if (current.trim().length > 0) {
      chunks.push(current.trim());
    }

    return chunks;
  }
}

