import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { formatDate, formatDateTime } from "@/lib/utils";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },
  item: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  itemTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 10,
    color: "#4b5563",
  },
});

interface AgendaItem {
  item_type: string;
  title: string;
  description?: string;
}

interface MeetingPackPdfProps {
  ocName: string;
  meetingTitle: string;
  meetingType: string;
  meetingDate: string;
  location?: string;
  agendaItems: AgendaItem[];
}

export function MeetingPackPdfDocument({
  ocName,
  meetingTitle,
  meetingType,
  meetingDate,
  location,
  agendaItems,
}: MeetingPackPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.title}>{meetingTitle}</Text>
          <Text style={styles.subtitle}>
            {ocName} • {meetingType.toUpperCase()} • {formatDateTime(meetingDate)}
          </Text>
          {location && (
            <Text style={styles.subtitle}>Location: {location}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agenda</Text>
          {agendaItems.map((item, i) => (
            <View key={i} style={styles.item}>
              <Text style={styles.itemTitle}>
                {i + 1}. [{item.item_type}] {item.title}
              </Text>
              {item.description && (
                <Text style={styles.itemDesc}>{item.description}</Text>
              )}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
