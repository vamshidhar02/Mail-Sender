import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { ContactListsController } from './contact-lists.controller';
import { ContactListsService } from './contact-lists.service';

@Module({
  controllers: [ContactsController, ContactListsController],
  providers: [ContactsService, ContactListsService],
  exports: [ContactsService, ContactListsService],
})
export class ContactsModule {}
