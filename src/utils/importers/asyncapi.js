/**
 * AsyncAPI Specification to Mermaid Diagram Converter
 * Converts Event-Driven channels, publish/subscribe operations, and Kafka/RabbitMQ events
 * into clean Mermaid sequence diagrams.
 */

export function parseAsyncApiToMermaid(specText) {
  if (!specText || typeof specText !== 'string') {
    throw new Error('Please provide AsyncAPI JSON text to convert.');
  }

  let spec;
  try {
    spec = JSON.parse(specText);
  } catch (err) {
    throw new Error(`AsyncAPI parser expects JSON: ${err.message}`);
  }

  const appTitle = (spec.info?.title || 'Event Architecture').replace(/["\n]/g, "'");
  const channels = spec.channels || {};
  const channelEntries = Object.entries(channels);

  if (channelEntries.length === 0) {
    throw new Error('No channels found in AsyncAPI specification.');
  }

  const output = ['sequenceDiagram'];
  output.push('  autonumber');
  output.push(`  participant App as "${appTitle}"`);
  output.push('  participant Broker as "Event Broker (Kafka/RabbitMQ)"');
  output.push('  participant Consumer as "Subscribed Consumer"');

  for (const [channelName, channelDef] of channelEntries.slice(0, 12)) {
    const cleanChan = channelName.replace(/["\n]/g, "'");

    // Handle v2 AsyncAPI (publish / subscribe)
    if (channelDef.publish) {
      const msgName = channelDef.publish.message?.name || channelDef.publish.summary || 'Event Message';
      output.push(`  App->>Broker: Publish to [${cleanChan}]`);
      output.push(`  Broker-->>Consumer: Distribute (${msgName})`);
    }

    if (channelDef.subscribe) {
      const msgName = channelDef.subscribe.message?.name || channelDef.subscribe.summary || 'Event Command';
      output.push(`  Consumer->>Broker: Produce event [${cleanChan}]`);
      output.push(`  Broker-->>App: Deliver to subscriber (${msgName})`);
    }

    // Handle v3 AsyncAPI if channels only contain address
    if (!channelDef.publish && !channelDef.subscribe) {
      output.push(`  App->>Broker: Event Channel [${cleanChan}]`);
    }
  }

  return output.join('\n');
}
