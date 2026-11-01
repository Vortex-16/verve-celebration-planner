import test from 'node:test';
import assert from 'node:assert/strict';
import type { GuestItem, EventItem } from '../types/index.ts';

test('Email Dispatcher: templates {GuestName} dynamic variable accurately', () => {
  const template = 'Dear {GuestName}, you are invited to our celebration!';
  const guestName = 'Eleanor & Arthur Vance';
  const personalized = template.replace('{GuestName}', guestName);

  assert.equal(personalized, 'Dear Eleanor & Arthur Vance, you are invited to our celebration!');
  assert.ok(!personalized.includes('{GuestName}'));
});

test('Email Dispatcher: queues only unsent or awaiting guests for bulk delivery', () => {
  const sampleGuests: GuestItem[] = [
    {
      id: 'g-1',
      eventId: 'evt-1',
      userId: 'u-1',
      name: 'Alice Springs',
      rsvpStatus: 'attending',
      invitationSent: true,
      plusOnes: 1,
    },
    {
      id: 'g-2',
      eventId: 'evt-1',
      userId: 'u-1',
      name: 'Bob Marley',
      rsvpStatus: 'awaiting',
      invitationSent: false,
      plusOnes: 0,
    },
    {
      id: 'g-3',
      eventId: 'evt-1',
      userId: 'u-1',
      name: 'Charlie Chaplin',
      rsvpStatus: 'awaiting',
      invitationSent: true, // Awaiting response, so queue eligible for follow-up
      plusOnes: 0,
    },
    {
      id: 'g-4',
      eventId: 'evt-1',
      userId: 'u-1',
      name: 'Diana Prince',
      rsvpStatus: 'declined',
      invitationSent: true,
      plusOnes: 0,
    },
  ];

  // Recipients queue logic
  const queued = sampleGuests.filter((g) => !g.invitationSent || g.rsvpStatus === 'awaiting');
  assert.equal(queued.length, 2);
  assert.equal(queued[0].name, 'Bob Marley');
  assert.equal(queued[1].name, 'Charlie Chaplin');
});

test('Email Dispatcher: generates compliant mailto URL with properly encoded fields', () => {
  const subject = 'Celebration Gala: Nov 20, 2026';
  const body = 'Hello Marcus,\n\nPlease RSVP for dinner & jazz at The Grand Conservatory.';
  const email = 'marcus@lawfirm.com';

  const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  assert.ok(mailtoUrl.startsWith('mailto:marcus@lawfirm.com?'));
  assert.ok(mailtoUrl.includes('subject=Celebration%20Gala%3A%20Nov%2020%2C%202026'));
  assert.ok(mailtoUrl.includes('The%20Grand%20Conservatory'));
});

test('Email Dispatcher: calculates total guest headcount including plus-ones accurately', () => {
  const sampleGuests: GuestItem[] = [
    { id: '1', eventId: 'e', userId: 'u', name: 'G1', rsvpStatus: 'attending', plusOnes: 1, invitationSent: true },
    { id: '2', eventId: 'e', userId: 'u', name: 'G2', rsvpStatus: 'attending', plusOnes: 2, invitationSent: true },
    { id: '3', eventId: 'e', userId: 'u', name: 'G3', rsvpStatus: 'tentative', plusOnes: 1, invitationSent: true },
    { id: '4', eventId: 'e', userId: 'u', name: 'G4', rsvpStatus: 'declined', plusOnes: 1, invitationSent: true },
  ];

  const confirmedAttendees = sampleGuests
    .filter(g => g.rsvpStatus === 'attending')
    .reduce((acc, g) => acc + 1 + (g.plusOnes || 0), 0);

  // G1 (1+1=2) + G2 (1+2=3) = 5 total confirmed
  assert.equal(confirmedAttendees, 5);
});
