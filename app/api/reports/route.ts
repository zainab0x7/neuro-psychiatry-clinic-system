import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Patient from '@/models/Patient';
import Appointment from '@/models/Appointment';
import Consultation from '@/models/Consultation';
import Prescription from '@/models/Prescription';
import FollowUp from '@/models/FollowUp';
import { authorizeUser } from '@/lib/permissions';

// GET /api/reports - Aggregation statistics for practice analytics
export async function GET() {
  try {
    const auth = await authorizeUser(['DOCTOR', 'ADMIN']);
    if (!auth.authorized) return auth.response!;

    await dbConnect();

    const todayStr = new Date().toISOString().split('T')[0];
    const currentYearMonth = todayStr.slice(0, 7); // e.g. 2026-09

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    // MongoDB Aggregations & Counts
    const [
      totalPatients,
      newPatientsCount,
      todayAppointmentsCount,
      monthlyAppointmentsCount,
      completedAppointmentsCount,
      cancelledAppointmentsCount,
      totalAppointmentsCount,
      totalConsultationsCount,
      totalPrescriptionsCount,
      followUpsAggregation,
      genderDistribution,
      patientStatusDistribution,
    ] = await Promise.all([
      Patient.countDocuments(),
      Patient.countDocuments({ registeredDate: { $gte: thirtyDaysAgoStr } }),
      Appointment.countDocuments({ appointmentDate: todayStr }),
      Appointment.countDocuments({ appointmentDate: { $regex: `^${currentYearMonth}` } }),
      Appointment.countDocuments({ status: 'Completed' } as any),
      Appointment.countDocuments({ status: 'Cancelled' } as any),
      Appointment.countDocuments(),
      Consultation.countDocuments(),
      Prescription.countDocuments(),
      FollowUp.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Patient.aggregate([
        {
          $group: {
            _id: '$gender',
            count: { $sum: 1 },
          },
        },
      ]),
      Patient.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Format follow-up counts
    const followUpStats: Record<string, number> = {
      Due: 0,
      Upcoming: 0,
      Overdue: 0,
      Completed: 0,
    };

    followUpsAggregation.forEach((item) => {
      const key = item._id as string;
      if (key) {
        const normalized = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
        followUpStats[normalized] = (followUpStats[normalized] || 0) + item.count;
      }
    });

    const reportsData = {
      summary: {
        totalPatients,
        newPatients: newPatientsCount,
        todayAppointments: todayAppointmentsCount,
        monthlyAppointments: monthlyAppointmentsCount,
        completedAppointments: completedAppointmentsCount,
        cancelledAppointments: cancelledAppointmentsCount,
        totalAppointments: totalAppointmentsCount,
        totalConsultations: totalConsultationsCount,
        totalPrescriptions: totalPrescriptionsCount,
      },
      followUps: followUpStats,
      genderBreakdown: genderDistribution.map(g => ({ gender: g._id, count: g.count })),
      statusBreakdown: patientStatusDistribution.map(s => ({ status: s._id, count: s.count })),
    };

    return NextResponse.json({
      success: true,
      data: reportsData,
    });
  } catch (error: any) {
    console.error('Error generating practice reports:', error);
    return NextResponse.json(
      { success: false, error: 'Database aggregation error generating reports.' },
      { status: 500 }
    );
  }
}
