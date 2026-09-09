import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Distinct names so a seeded send visibly proves per-recipient merging. */
const PEOPLE = [
  { firstName: 'Ada', lastName: 'Lovelace', plan: 'enterprise' },
  { firstName: 'Grace', lastName: 'Hopper', plan: 'pro' },
  { firstName: 'Alan', lastName: 'Turing', plan: 'pro' },
  { firstName: 'Katherine', lastName: 'Johnson', plan: 'free' },
  { firstName: 'Linus', lastName: 'Torvalds', plan: 'free' },
  { firstName: 'Barbara', lastName: 'Liskov', plan: 'enterprise' },
  { firstName: 'Edsger', lastName: 'Dijkstra', plan: 'free' },
  { firstName: 'Margaret', lastName: 'Hamilton', plan: 'pro' },
  { firstName: 'Ken', lastName: 'Thompson', plan: 'free' },
  { firstName: 'Radia', lastName: 'Perlman', plan: 'enterprise' },
];

async function main() {
  const list = await prisma.contactList.upsert({
    where: { name: 'Newsletter' },
    update: {},
    create: { name: 'Newsletter', description: 'Default seed list' },
  });

  for (const person of PEOPLE) {
    const email = person.firstName.toLowerCase() + '@example.com';

    const contact = await prisma.contact.upsert({
      where: { email },
      update: {},
      create: {
        email,
        firstName: person.firstName,
        lastName: person.lastName,
        attributes: { plan: person.plan },
      },
    });

    await prisma.contactListMembership.upsert({
      where: { contactId_listId: { contactId: contact.id, listId: list.id } },
      update: {},
      create: { contactId: contact.id, listId: list.id },
    });
  }

  const template = await prisma.template.create({
    data: {
      name: 'Welcome',
      subject: 'Welcome aboard, {{firstName}}!',
      html:
        '<h1>Hi {{firstName}} {{lastName}}</h1>' +
        '<p>Thanks for joining. You are on the <b>{{attributes.plan}}</b> plan.</p>',
      variables: ['firstName', 'lastName', 'attributes.plan'],
    },
  });

  await prisma.campaign.create({
    data: {
      name: 'Welcome blast',
      templateId: template.id,
      fromName: 'Mail Sender',
      fromEmail: 'no-reply@localhost',
      lists: { create: [{ listId: list.id }] },
    },
  });

  console.log(
    'Seed complete: 1 list, ' + PEOPLE.length + ' contacts, 1 template, 1 draft campaign.',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
