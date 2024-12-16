import { Logger } from '@nestjs/common';
import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import axios from 'axios';
import { Server } from 'ws';
import * as WebSocket from 'ws';

interface MessagePayload {
  event: string;
  text: string;
  to?: string;
  from?: string;
  fileName?: string | null; 
  fileUrl?: string | null;  
}

interface InfoPayload {
  event: string;
  totalClients: number;
  clients: string[];
}

@WebSocketGateway({ transports: ['websocket'], secure: false })
export class SocketGateway implements OnGatewayInit {
  private logger: Logger = new Logger('SocketEventsGateway');
  private summaryClient: number = 0;

  private slackWebhookUrl: string =
  'https://hooks.slack.com/services/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';

private async sendMessageToSlack(text: string) {
  try {
    const message = {
      text: text,
    };

    await axios.post(this.slackWebhookUrl, message);
    this.logger.verbose(`Slack xabar yuborildi: ${text}`);
  } catch (error) {
    this.logger.error('Slack xabar yuborishda xatolik yuz berdi', error);
  }
}
  @WebSocketServer()
  server: Server;

  private clients: Map<string, WebSocket> = new Map();

  public afterInit(server: Server) {
    this.logger.verbose(
      `WebSocket Server Initialized total: [${this.summaryClient}]`,
    );
  }

  handleConnection(client: WebSocket, ...args: any[]) {
    this.summaryClient++;
    this.logger.verbose(`Connection & total: [${this.summaryClient}]`);

    const clientId = this.generateUniqueId();
    (client as any).id = clientId;
    this.clients.set(clientId, client);
    this.logger.verbose(
      `Client Registered: Name [${(client as any).name}], ID [${(client as any).id}]`,
    );

    client.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.event === 'register' && payload.name) {
          (client as any).name = payload.name.trim();
          this.logger.verbose(
            `Client Registered: Name [${(client as any).name}], ID [${(client as any).id}]`,
          );
          this.updateClientsInfo();
        }
      } catch (error) {
        this.logger.error('Error parsing register event', error);
      }
    });

    this.updateClientsInfo();
  }

  handleDisconnect(client: WebSocket) {
    this.summaryClient--;
    this.logger.verbose(`Disconnection & total: [${this.summaryClient}]`);

    const clientId = (client as any).id;
    this.clients.delete(clientId);

    this.updateClientsInfo();
  }

  @SubscribeMessage('message')
  public async handlePrivateMessage(
    client: WebSocket,
    payload: MessagePayload,
  ): Promise<void> {
    if (!payload || !payload.text || !payload.to) {
      this.logger.error('Invalid private message payload');
      return;
    }

    const from = (client as any).name || (client as any).id;
    const { to, text,  fileName, fileUrl } = payload;

    const privateMessage: MessagePayload = {
      event: 'message',
      text,
      to,
      from,
      fileName: fileName || null, 
      fileUrl: fileUrl || null,
      
    };

    this.logger.verbose(`1:1 MESSAGE from ${from} to ${to}: ${text}`);
    this.sendMessageToClient(to, privateMessage);
    this.sendMessageToClient(from, privateMessage);
   const slackMessage = `새로운 그룹 메시지:\n\n보낸 사람: ${from}\n내용: ${text}`
  await this.sendMessageToSlack(slackMessage);
  }

  @SubscribeMessage('groupmessage')
  public async handleGroupMessage(
    client: WebSocket,
    payload: MessagePayload,
  ): Promise<void> {
    if (!payload || !payload.text) {
      this.logger.error('Invalid group message payload');
      return;
    }

    const from = (client as any).name || (client as any).id;
    const { text,  fileName, fileUrl  } = payload;

    const groupMessage: MessagePayload = {
      event: 'groupmessage',
      text,
      from,
      fileName: fileName || null, 
      fileUrl: fileUrl || null,
    };

    this.logger.verbose(`GROUP MESSAGE from ${from}: ${text}`);
    this.emitMessage(groupMessage);

  
 const slackMessage = `새로운 그룹 메시지:\n\n보낸 사람: ${from}\n내용: ${text}`
  await this.sendMessageToSlack(slackMessage);
  }

  private emitMessage(message: InfoPayload | MessagePayload) {
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  private sendMessageToClient(clientId: string, message: MessagePayload) {
    const targetClient = this.findClientByName(clientId);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      targetClient.send(JSON.stringify(message), (error) => {
        if (error) {
          this.logger.error(
            `Failed to deliver message to Client ID [${clientId}]: ${error.message}`,
          );
        }
      });
    } else {
      this.logger.warn(`Client with ID ${clientId} not found or disconnected`);
    }
  }

  private updateClientsInfo() {
    const infoMsg: InfoPayload = {
      event: 'info',
      totalClients: this.summaryClient,
      clients: Array.from(this.clients.values()).map(
        (client) => (client as any).name || (client as any).id,
      ),
    };
    this.emitMessage(infoMsg);
  }

  private findClientByName(name: string): WebSocket | undefined {
    for (const client of this.clients.values()) {
      if ((client as any).name === name) {
        return client;
      }
    }
    return undefined;
  }

  private generateUniqueId(): string {
    return Math.random().toString(36).slice(2, 9);
  }
}
