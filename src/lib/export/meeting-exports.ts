import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { loadMeetingById } from '../meetings';
import { loadAgendaByMeeting } from '../agendas';
import { loadAgendaItemsWithSubItems } from '../agenda';
import { loadMinutesByMeeting } from '../meeting-minutes';
import { loadLinkedPolls } from '../poll-agenda-links';
import { loadPolls } from '../polls';
import { format } from 'date-fns';

/**
 * Export meeting minutes as PDF
 */
export const exportMeetingMinutesPDF = async (meetingId: string): Promise<Uint8Array> => {
  try {
    const meeting = await loadMeetingById(meetingId);
    if (!meeting) throw new Error('Meeting not found');

    const agenda = await loadAgendaByMeeting(meetingId);
    const agendaItems = agenda ? await loadAgendaItemsWithSubItems({
      meeting_id: meetingId,
      agenda_id: agenda.id,
    }) : [];
    const minutes = await loadMinutesByMeeting(meetingId);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 800;
    const margin = 50;
    const lineHeight = 20;

    // Title
    page.drawText('MEETING MINUTES', {
      x: margin,
      y,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    y -= 40;

    // Meeting info
    page.drawText(`Meeting: ${meeting.title}`, {
      x: margin,
      y,
      size: 14,
      font: boldFont,
    });
    y -= lineHeight;

    page.drawText(`Date: ${format(new Date(meeting.scheduled_date), 'PPP')}`, {
      x: margin,
      y,
      size: 12,
      font,
    });
    y -= lineHeight;

    page.drawText(`Time: ${meeting.scheduled_time}`, {
      x: margin,
      y,
      size: 12,
      font,
    });
    y -= lineHeight;

    if (meeting.location) {
      page.drawText(`Location: ${meeting.location}`, {
        x: margin,
        y,
        size: 12,
        font,
      });
      y -= lineHeight;
    }

    y -= 20;

    // Agenda items and minutes
    for (const item of agendaItems) {
      if (y < 100) {
        const newPage = pdfDoc.addPage([595, 842]);
        y = 800;
      }

      const itemMinutes = minutes.find(m => m.agenda_item_id === item.id);
      
      page.drawText(`${item.order_index + 1}. ${item.title}`, {
        x: margin,
        y,
        size: 14,
        font: boldFont,
      });
      y -= lineHeight;

      if (item.description) {
        const descLines = wrapText(item.description, 495, font, 10);
        for (const line of descLines) {
          page.drawText(line, {
            x: margin + 20,
            y,
            size: 10,
            font,
          });
          y -= lineHeight;
        }
      }

      if (itemMinutes) {
        y -= 10;
        if (itemMinutes.discussion_summary) {
          page.drawText('Discussion:', {
            x: margin + 20,
            y,
            size: 12,
            font: boldFont,
          });
          y -= lineHeight;

          const discussionLines = wrapText(itemMinutes.discussion_summary, 475, font, 10);
          for (const line of discussionLines) {
            page.drawText(line, {
              x: margin + 40,
              y,
              size: 10,
              font,
            });
            y -= lineHeight;
          }
        }

        if (itemMinutes.decisions && itemMinutes.decisions.length > 0) {
          y -= 10;
          page.drawText('Decisions:', {
            x: margin + 20,
            y,
            size: 12,
            font: boldFont,
          });
          y -= lineHeight;

          itemMinutes.decisions.forEach((decision) => {
            const decisionLines = wrapText(decision.description, 475, font, 10);
            for (const line of decisionLines) {
              page.drawText(`• ${line}`, {
                x: margin + 40,
                y,
                size: 10,
                font,
              });
              y -= lineHeight;
            }
          });
        }

        if (itemMinutes.action_items && itemMinutes.action_items.length > 0) {
          y -= 10;
          page.drawText('Action Items:', {
            x: margin + 20,
            y,
            size: 12,
            font: boldFont,
          });
          y -= lineHeight;

          itemMinutes.action_items.forEach((action) => {
            const actionLines = wrapText(action.description, 475, font, 10);
            for (const line of actionLines) {
              page.drawText(`• ${line}`, {
                x: margin + 40,
                y,
                size: 10,
                font,
              });
              y -= lineHeight;
            }
          });
        }
      }

      y -= 20;
    }

    return pdfDoc.save();
  } catch (error) {
    console.error('Error exporting meeting minutes PDF:', error);
    throw error;
  }
};

/**
 * Export agenda as PDF
 */
export const exportAgendaPDF = async (meetingId: string): Promise<Uint8Array> => {
  try {
    const meeting = await loadMeetingById(meetingId);
    if (!meeting) throw new Error('Meeting not found');

    const agenda = await loadAgendaByMeeting(meetingId);
    const agendaItems = agenda ? await loadAgendaItemsWithSubItems({
      meeting_id: meetingId,
      agenda_id: agenda.id,
    }) : [];

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 800;
    const margin = 50;
    const lineHeight = 20;

    // Title
    page.drawText('MEETING AGENDA', {
      x: margin,
      y,
      size: 24,
      font: boldFont,
    });
    y -= 40;

    // Meeting info
    page.drawText(`Meeting: ${meeting.title}`, {
      x: margin,
      y,
      size: 14,
      font: boldFont,
    });
    y -= lineHeight;

    page.drawText(`Date: ${format(new Date(meeting.scheduled_date), 'PPP')}`, {
      x: margin,
      y,
      size: 12,
      font,
    });
    y -= lineHeight;

    page.drawText(`Time: ${meeting.scheduled_time}`, {
      x: margin,
      y,
      size: 12,
      font,
    });
    y -= lineHeight;

    y -= 20;

    // Agenda items
    page.drawText('AGENDA ITEMS', {
      x: margin,
      y,
      size: 16,
      font: boldFont,
    });
    y -= 30;

    for (const item of agendaItems) {
      if (y < 100) {
        const newPage = pdfDoc.addPage([595, 842]);
        y = 800;
      }

      page.drawText(`${item.order_index + 1}. ${item.title}`, {
        x: margin,
        y,
        size: 14,
        font: boldFont,
      });
      y -= lineHeight;

      if (item.description) {
        const descLines = wrapText(item.description, 495, font, 10);
        for (const line of descLines) {
          page.drawText(line, {
            x: margin + 20,
            y,
            size: 10,
            font,
          });
          y -= lineHeight;
        }
      }

      if (item.sub_items && item.sub_items.length > 0) {
        for (const subItem of item.sub_items) {
          page.drawText(`  ${subItem.order_index + 1}. ${subItem.title}`, {
            x: margin + 20,
            y,
            size: 12,
            font,
          });
          y -= lineHeight;
        }
      }

      y -= 15;
    }

    return pdfDoc.save();
  } catch (error) {
    console.error('Error exporting agenda PDF:', error);
    throw error;
  }
};

/**
 * Export voting summary as PDF
 */
export const exportVotingSummary = async (meetingId: string): Promise<Uint8Array> => {
  try {
    const meeting = await loadMeetingById(meetingId);
    if (!meeting) throw new Error('Meeting not found');

    const agenda = await loadAgendaByMeeting(meetingId);
    const agendaItems = agenda ? await loadAgendaItemsWithSubItems({
      meeting_id: meetingId,
      agenda_id: agenda.id,
    }) : [];

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 800;
    const margin = 50;
    const lineHeight = 20;

    // Title
    page.drawText('VOTING SUMMARY', {
      x: margin,
      y,
      size: 24,
      font: boldFont,
    });
    y -= 40;

    page.drawText(`Meeting: ${meeting.title}`, {
      x: margin,
      y,
      size: 14,
      font: boldFont,
    });
    y -= lineHeight;

    page.drawText(`Date: ${format(new Date(meeting.scheduled_date), 'PPP')}`, {
      x: margin,
      y,
      size: 12,
      font,
    });
    y -= 30;

    // Get polls linked to agenda items
    for (const item of agendaItems) {
      const linkedPolls = await loadLinkedPolls(item.id);
      
      if (linkedPolls.length > 0) {
        if (y < 150) {
          const newPage = pdfDoc.addPage([595, 842]);
          y = 800;
        }

        page.drawText(`Agenda Item: ${item.title}`, {
          x: margin,
          y,
          size: 14,
          font: boldFont,
        });
        y -= 25;

        for (const poll of linkedPolls) {
          const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);

          page.drawText(`Poll: ${poll.title}`, {
            x: margin + 20,
            y,
            size: 12,
            font: boldFont,
          });
          y -= lineHeight;

          page.drawText(`Total Votes: ${totalVotes}`, {
            x: margin + 40,
            y,
            size: 10,
            font,
          });
          y -= lineHeight;

          for (const option of poll.options) {
            const votes = option.votes?.length || 0;
            const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0';
            
            page.drawText(`  ${option.text}: ${votes} votes (${percentage}%)`, {
              x: margin + 40,
              y,
              size: 10,
              font,
            });
            y -= lineHeight;
          }

          y -= 10;
        }

        y -= 15;
      }
    }

    return pdfDoc.save();
  } catch (error) {
    console.error('Error exporting voting summary:', error);
    throw error;
  }
};

/**
 * Export meeting data as JSON
 */
export const exportMeetingJSON = async (meetingId: string): Promise<string> => {
  try {
    const meeting = await loadMeetingById(meetingId);
    if (!meeting) throw new Error('Meeting not found');

    const agenda = await loadAgendaByMeeting(meetingId);
    const agendaItems = agenda ? await loadAgendaItemsWithSubItems({
      meeting_id: meetingId,
      agenda_id: agenda.id,
    }) : [];
    const minutes = await loadMinutesByMeeting(meetingId);

    const exportData = {
      meeting: {
        id: meeting.id,
        type: meeting.type,
        title: meeting.title,
        scheduled_date: meeting.scheduled_date,
        scheduled_time: meeting.scheduled_time,
        location: meeting.location,
        status: meeting.status,
      },
      agenda: agenda ? {
        id: agenda.id,
        version: agenda.version,
        status: agenda.status,
        rules: agenda.rules,
      } : null,
      agenda_items: agendaItems,
      minutes: minutes,
      export_date: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting meeting JSON:', error);
    throw error;
  }
};

/**
 * Helper function to wrap text
 */
function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);

    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

