import { Injectable } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';

@Injectable()
export class MessagesRepository {
  async findOne(id: string) {
    const data = await readFile('src/messages/messages.json', 'utf8');
    const messages = JSON.parse(data) as Record<
      string,
      { id: string; content: string }
    >;
    return messages[id];
  }

  async findAll() {
    const data = await readFile('src/messages/messages.json', 'utf8');
    const messages = JSON.parse(data) as Record<
      string,
      { id: string; content: string }
    >;
    return messages;
  }

  async create(content: string) {
    const data = await readFile('src/messages/messages.json', 'utf8');
    const messages = JSON.parse(data) as Record<
      string,
      { id: string; content: string }
    >;

    const id = Math.floor(Math.random() * 999).toString();
    messages[id] = { id, content };
    await writeFile('src/messages/messages.json', JSON.stringify(messages));
    return messages[id];
  }
}
