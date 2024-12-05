// import { Logger } from '@nestjs/common';
// import {
//   OnGatewayInit,
//   SubscribeMessage,
//   WebSocketGateway,
//   WebSocketServer,
// } from '@nestjs/websockets';
// import { Server } from 'ws';
// import * as WebSocket from 'ws';

// interface MessagePayload {
//   event: string;
//   text: string;
//   to?: string; // Faqat 1:1 chat uchun
//   from?: string; // Faqat 1:1 chat uchun
// }

// interface InfoPayload {
//   event: string;
//   totalClients: number;
// }

// @WebSocketGateway({ transports: ['websocket'], secure: false })
// export class SocketGateway implements OnGatewayInit {
//   private logger: Logger = new Logger('SocketEventsGateway');
//   private summaryClient: number = 0;

//   @WebSocketServer()
//   server: Server;

//   // Clientlarni ulash uchun mapping
//   private clients: Map<string, WebSocket> = new Map();

//   public afterInit(server: Server) {
//     this.logger.verbose(`
//       WebSocket Server Initialized total: [${this.summaryClient}],`
//     );
//   }

//   handleConnection(client: WebSocket, ...args: any[]) {
//     this.summaryClient++;
//     this.logger.verbose(`Connection & total: [${this.summaryClient}]`);

//     // Foydalanuvchini ID bilan bog'lash
//     const clientId = this.generateUniqueId();
//     (client as any).id = clientId; // WebSocket ob'ektiga ID qo'shish
//     this.clients.set(clientId, client);
//     console.log('clientID', clientId);

//     const infoMsg: InfoPayload = {
//       event: 'info',
//       totalClients: this.summaryClient,
//     };
//     this.emitMessage(infoMsg);
//   }

//   handleDisconnect(client: WebSocket) {
//     this.summaryClient--;
//     this.logger.verbose(`Disconnection & total: [${this.summaryClient}]`);

//     // Clientni o'chirish
//     const clientId = (client as any).id;
//     this.clients.delete(clientId);

//     const infoMsg: InfoPayload = {
//       event: 'info',
//       totalClients: this.summaryClient,
//     };
//     this.broadcastMessage(client, infoMsg);
//   }

//   @SubscribeMessage('message')
//   public async handleMessage(client: WebSocket, payload: any): Promise<void> {
//     console.log('subcribega yetib keldi', payload);
//     try {
//       if (typeof payload === 'string') {
//         payload = JSON.parse(payload); // Stringni JSON obyektga o'zgartirish
//       }
//     } catch (error) {
//       this.logger.error('Invalid payload: Payload is not a valid JSON string');
//       return;
//     }

//     if (!payload || typeof payload !== 'object') {
//       this.logger.error('Invalid payload: Payload is not an object or missing');
//       return;
//     }

// 	  // Ma'lumotlarni olish
// 	  const text = payload.text || (payload.data && payload.data.text) || payload.data;
// 	  const to = payload.to || (payload.data && payload.data.to);
// 	  const from = payload.from || (payload.data && payload.data.from);

// 	  if (!text) {
// 		  this.logger.error('Invalid payload: missing text or data');
// 		  return;
// 	  }
//     if (payload.to) {
//       // 1:1 chat
//       this.logger.verbose(
//       `  1:1 MESSAGE from ${payload.from} to ${payload.to}: ${payload.text},`
//       );
//       this.sendMessageToClient(payload.to, {
//         event: 'message',
//         text,
//      	from
//       });
//     } else {
//       // Group chat
// 	  console.log("group uchun", payload)
//       this.logger.verbose(`GROUP MESSAGE: ${payload.text}`);
//       const groupMsg: MessagePayload = { event: 'message', text };
//       this.emitMessage(groupMsg);
//     }
//   }

//   private broadcastMessage(
//     sender: WebSocket,
//     message: InfoPayload | MessagePayload,
//   ) {
//     this.server.clients.forEach((client) => {
//       if (client !== sender && client.readyState === WebSocket.OPEN) {
//         client.send(JSON.stringify(message));
//       }
//     });
//   }

//   private emitMessage(message: InfoPayload | MessagePayload) {
//     this.server.clients.forEach((client) => {
//       if (client.readyState === WebSocket.OPEN) {
//         client.send(JSON.stringify(message));
//       }
//     });
//   }

//   private sendMessageToClient(clientId: string, message: any) {
//     const targetClient = this.clients.get(clientId);
//     if (targetClient && targetClient.readyState === WebSocket.OPEN) {
//       targetClient.send(JSON.stringify(message));
//     } else {
//       this.logger.warn(`Client with ID ${clientId} not found or disconnected`);
//     }
//   }

//   private generateUniqueId(): string {
//     return Math.random().toString(36).slice(2, 9);
//   }
// }



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
  to?: string; // Faqat 1:1 chat uchun
  from?: string; // Faqat 1:1 chat uchun
}

interface InfoPayload {
  event: string;
  totalClients: number;
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
    console.log('clientID', clientId);

    const infoMsg: InfoPayload = {
      event: 'info',
      totalClients: this.summaryClient,
    };
    this.emitMessage(infoMsg);
  }

  handleDisconnect(client: WebSocket) {
    this.summaryClient--;
    this.logger.verbose(`Disconnection & total: [${this.summaryClient}]`);

    const clientId = (client as any).id;
    this.clients.delete(clientId);

    const infoMsg: InfoPayload = {
      event: 'info',
      totalClients: this.summaryClient,
    };
    this.emitMessage(infoMsg);
  }

  @SubscribeMessage('message')
  public async handleMessage(client: WebSocket, payload: any): Promise<void> {
    try {
      if (typeof payload === 'string') {
        payload = JSON.parse(payload);
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
    const from = (client as any).id; // Senderning ID sini olamiz

    if (!text) {
      this.logger.error('Invalid payload: missing text or data');
      return;
    }

    if (to) {
      // 1:1 chat
      this.logger.verbose(`1:1 MESSAGE from ${from} to ${to}: ${text}`);

      const message: MessagePayload = {
        event: 'message',
        text,
        to,
        from,
      };

      // Senderga va receiverga xabarni jo'natish
      this.sendMessageToClient(to, message);
      this.sendMessageToClient(from, message);
    } else {
      // Group chat
      this.logger.verbose(`GROUP MESSAGE: ${text}`);
      const groupMsg: MessagePayload = { event: 'message', text };
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
    const targetClient = this.clients.get(clientId);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      targetClient.send(JSON.stringify(message));
    } else {
      this.logger.warn(`Client with ID ${clientId} not found or disconnected`);
    }
  }

  private generateUniqueId(): string {
    return Math.random().toString(36).slice(2, 9);
  }
}
