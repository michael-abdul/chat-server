
import { Logger } from '@nestjs/common';
import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'ws';
import * as WebSocket from 'ws';

interface MessagePayload {
  event: string;
  text: string;
  to?: string; 
  from?: string; 
}

interface InfoPayload {
  event: string;
  totalClients: number;
  clients:string[];
}

@WebSocketGateway({ transports: ['websocket'], secure: false })
export class SocketGateway implements OnGatewayInit {
  private logger: Logger = new Logger('SocketEventsGateway');
  private summaryClient: number = 0;

  @WebSocketServer()
  server: Server;

  private clients: Map<string, WebSocket> = new Map();

  public afterInit(server: Server) {
    this.logger.verbose(`WebSocket Server Initialized total: [${this.summaryClient}]`);
  }

  handleConnection(client: WebSocket, ...args: any[]) {
    this.summaryClient++;
    this.logger.verbose(`Connection & total: [${this.summaryClient}]`);

    const clientId = this.generateUniqueId();
    (client as any).id = clientId;
    this.clients.set(clientId, client);
    this.logger.verbose(`Client Registered: Name [${(client as any).name}], ID [${(client as any).id}]`);

    client.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());
        console.log('Register payload received:', payload);
    
        if (payload.event === 'register' && payload.name) {
          (client as any).name = payload.name.trim(); // Ismni saqlash
          this.logger.verbose(`Client Registered: Name [${(client as any).name}], ID [${(client as any).id}]`);
          this.updateClientsInfo();
        } else {
          this.logger.warn('Invalid register event received', payload);
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

    const infoMsg: InfoPayload = {
      event: 'info',
      totalClients: this.summaryClient,
      clients: Array.from(this.clients.values()).map((client) => client.name || clientId),

    };
    this.emitMessage(infoMsg);
  }

  @SubscribeMessage('message')
  public async handleMessage(client: WebSocket, payload: any): Promise<void> {
    try {
      if (typeof payload === 'string') {
        payload = JSON.parse(payload);
        console.log('Received message payload:', JSON.stringify(payload, null, 2));
      }
    } catch (error) {
      this.logger.error('Invalid payload: Payload is not a valid JSON string');
      return;
    }

    if (!payload || typeof payload !== 'object') {
      this.logger.error('Invalid payload: Payload is not an object or missing');
      return;
    
    }

    const text = payload.text || (payload.data && payload.data.text) || payload.data;
    const to = payload.to || (payload.data && payload.data.to);
    const from = payload.data?.from || payload.from || (client as any).id;

    if (!text) {
      this.logger.error('Invalid payload: Missing text, to, or from fields');
      return;
    }

    if (to) {
      // 1:1 chat
      this.logger.verbose(`1:1 MESSAGE from ${from} to ${to}: ${text}`);

      const message: MessagePayload = {
        event: 'message',
        text,
        to,
    
      };
      const toClient = this.clients.get(to);
      if (!toClient) {
        this.logger.warn(`Client with ID ${to} not found or disconnected`);
      }
    
      this.sendMessageToClient(to, message);
      this.sendMessageToClient(from, message);
    } else {

    const groupMsg: MessagePayload = { 
      event: 'message', 
      text, 
      from // Jo‘natuvchini qo‘shamiz
    };
      // Group chat
      this.logger.verbose(`GROUP MESSAGE: ${text}`);
      console.log('groupMSG', groupMsg);
      this.emitMessage(groupMsg);
    }
  }

  private emitMessage(message: InfoPayload | MessagePayload) {
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
  private sendMessageToClient(clientId: string, message: any) {
    const targetClient = this.findClientByName(clientId);
  
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      try {
        console.log(
          `Target client found: ID [${(targetClient as any).id}] Name [${(targetClient as any).name}]`
        );
        message.from = (targetClient as any).name || (targetClient as any).id;
  
        // Xabarni yuborish
        targetClient.send(JSON.stringify(message), (error) => {
          if (error) {
            this.logger.error(
              `Failed to deliver message to Client ID [${clientId}]: ${error.message}`
            );
          } else {
            this.logger.verbose(
              `Message successfully delivered to Client ID [${clientId}], Name [${(targetClient as any).name}]`
            );
          }
        });
      } catch (error) {
        this.logger.error(
          `Error occurred while sending message to Client ID [${clientId}]: ${error.message}`
        );
      }
    } else {
      this.logger.warn(`Client with ID ${clientId} not found or disconnected`);
      console.log(
        'Available clients:',
        Array.from(this.clients.entries()).map(([id, client]) => ({
          id,
          name: (client as any).name,
        }))
      );
    }
  }
  

  private generateUniqueId(): string {
    return Math.random().toString(36).slice(2, 9);
  }
  private updateClientsInfo() {
    const infoMsg: InfoPayload = {
      event: 'info',
      totalClients: this.summaryClient,
      clients: Array.from(this.clients.values()).map((client) => (client as any).name || (client as any).id),
    };
    console.log('Updated clients list:', infoMsg.clients); // Log qo'shildi
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
  
}

  