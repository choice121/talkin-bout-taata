// Choice Properties — Shared Lease Article Content
// LEASE_TEMPLATE_VERSION: v2
//
// This is the CANONICAL source of lease article text (Articles 1–18).
// It is imported by sign-lease/index.ts to generate the stored signed PDF.
//
// The browser display counterpart is apply/lease.html → buildLeaseText().
// That function must stay in sync with this file.
// When updating article wording here, update apply/lease.html AND
// increment LEASE_TEMPLATE_VERSION in both places.

export const LEASE_TEMPLATE_VERSION = 'v2'

export interface LeaseArticleParams {
  tenantName: string
  landlordName: string
  landlordAddr: string
  propertyAddress: string
  monthlyRent: string
  securityDeposit: string
  moveInCosts: string
  lateFeeFlat: string
  lateFeeDaily: string
  gracePeriod: number
  noticeDays: number
  depositReturn: number
  eSignLaw: string
  disclosures: string[]
  petPolicy: string
  smokingPolicy: string
  endDateDisplay: string
  termNarrative: string
  today: string
}

export interface LeaseArticle {
  title: string
  body: string
}

export function buildLeaseArticles(p: LeaseArticleParams): LeaseArticle[] {
  return [
    {
      title: 'Article 1 — Parties and Premises',
      body: `This Residential Lease Agreement ("Agreement") is entered into as of ${p.today}, between <strong>${p.landlordName}</strong> ("Landlord"), located at ${p.landlordAddr}, and <strong>${p.tenantName}</strong> ("Tenant"). Landlord hereby leases to Tenant the residential premises located at <strong>${p.propertyAddress}</strong> ("Premises").`,
    },
    {
      title: 'Article 2 — Lease Term',
      body: `<strong>Termination Date:</strong> ${p.endDateDisplay}<br>${p.termNarrative}`,
    },
    {
      title: 'Article 3 — Rent',
      body: `Tenant agrees to pay Landlord monthly rent of <strong>$${p.monthlyRent}</strong>, due on the first (1st) day of each calendar month via a payment method agreed with Landlord's leasing team.`,
    },
    {
      title: 'Article 4 — Late Fees',
      body: `Rent not received within <strong>${p.gracePeriod} days</strong> of the due date (as permitted by applicable state law) shall be subject to a flat late fee of <strong>$${p.lateFeeFlat}</strong>, plus <strong>$${p.lateFeeDaily} per day</strong> for each additional day rent remains unpaid thereafter. Time is of the essence with respect to rent payment.`,
    },
    {
      title: 'Article 5 — Security Deposit',
      body: `A security deposit of <strong>$${p.securityDeposit}</strong> is held by Landlord and will be returned within <strong>${p.depositReturn} days</strong> of lease termination as required by applicable state law, less any deductions itemized in writing for damages beyond normal wear and tear or unpaid rent.`,
    },
    {
      title: 'Article 6 — Move-In Costs',
      body: `Prior to taking possession, Tenant shall pay the total move-in amount of <strong>$${p.moveInCosts}</strong> (first month's rent of $${p.monthlyRent} + security deposit of $${p.securityDeposit}). Possession is not delivered until all move-in funds are received and confirmed.`,
    },
    {
      title: 'Article 7 — Utilities',
      body: `Unless otherwise specified in a separate written addendum signed by both parties, Tenant shall be solely responsible for establishing service accounts and paying all costs for utilities serving the Premises, including but not limited to electricity, natural gas, water, sewer, trash collection, telephone, internet, and cable or streaming services. Landlord shall not be liable for any interruption, failure, or reduction in utility service not caused by Landlord's direct action.`,
    },
    {
      title: 'Article 8 — Use of Premises',
      body: `The Premises shall be used solely as a private residential dwelling by the named Tenant(s) and approved occupants listed in the application. No commercial activity, subletting, or assignment of this Agreement is permitted without the prior written consent of Landlord. Tenant shall comply with all applicable laws, ordinances, homeowner association rules, and community guidelines.`,
    },
    {
      title: 'Article 9 — Maintenance and Repairs',
      body: `Tenant shall maintain the Premises in a clean, sanitary, and habitable condition. Tenant shall promptly notify Landlord in writing of any damage or required repairs. Tenant is responsible for all damage caused by negligence or intentional acts of Tenant, guests, or occupants. No structural or cosmetic alterations shall be made to the Premises without prior written consent of Landlord.`,
    },
    {
      title: 'Article 10 — Entry by Landlord',
      body: `Landlord or Landlord's authorized agents may enter the Premises at reasonable times with advance notice as required by applicable state law for purposes including inspection, repairs, or showing the Premises to prospective tenants or purchasers. In cases of emergency, Landlord may enter without prior notice.`,
    },
    {
      title: 'Article 11 — Pets and Smoking',
      body: `<strong>Pets:</strong> ${p.petPolicy}<br><strong>Smoking:</strong> ${p.smokingPolicy}`,
    },
    {
      title: 'Article 12 — Default and Termination',
      body: `A material breach of this Agreement — including but not limited to non-payment of rent after the <strong>${p.gracePeriod}-day</strong> grace period, unauthorized subletting, or violation of community rules — entitles Landlord to deliver written notice of termination as required by applicable state law (minimum <strong>${p.noticeDays} days</strong> written notice for this jurisdiction). Tenant shall vacate the Premises on or before the date specified in such notice. Holdover tenancy without Landlord's written consent shall result in Tenant's liability for double rent and all damages caused thereby.`,
    },
    {
      title: 'Article 13 — Early Termination',
      body: `If Tenant wishes to terminate this Agreement before the Termination Date specified in Article 2, Tenant shall provide Landlord with written notice as required under Article 14 and shall remain obligated for all rent and charges through the earlier of: (i) the Termination Date, or (ii) the date a qualified replacement tenant, approved by Landlord, takes possession of the Premises. Landlord shall make commercially reasonable efforts to re-let the Premises to mitigate Tenant's continuing liability. Tenant's early termination obligations are governed by applicable state law.`,
    },
    {
      title: 'Article 14 — Notice to Vacate',
      body: `Either party may terminate this Agreement at the end of the lease term upon written notice delivered to the other party as required by applicable state law. For this jurisdiction, a minimum of <strong>${p.noticeDays} days</strong> written notice is required prior to the intended move-out date.`,
    },
    {
      title: 'Article 15 — Governing Law',
      body: `This Agreement is governed by the laws of the state in which the Premises is located. Any dispute arising under this Agreement shall be resolved in the appropriate courts of that jurisdiction.`,
    },
    {
      title: 'Article 16 — Electronic Signature',
      body: `This Agreement may be executed by electronic signature, which is legally binding to the same extent as a handwritten signature pursuant to the <strong>${p.eSignLaw}</strong>. Each party's electronic signature constitutes their original signature for all purposes.`,
    },
    {
      title: 'Article 17 — Entire Agreement',
      body: `This Agreement, together with any written addenda signed by both parties, constitutes the entire agreement between the parties and supersedes all prior oral or written agreements, understandings, or representations. It may only be modified by a written instrument signed by both Landlord and Tenant.`,
    },
    {
      title: 'Article 18 — Required Disclosures',
      body: [
        ...p.disclosures.map(d => `⚠️ ${d}`),
        '⚠️ Equal Housing Opportunity: This property is offered in compliance with all applicable federal, state, and local fair housing laws. Discrimination on the basis of any protected class is prohibited.',
      ].join('<br>'),
    },
  ]
}
