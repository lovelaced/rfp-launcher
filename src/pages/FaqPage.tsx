import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useState, ReactElement } from "react";

interface FaqItem {
  question: string;
  answer: ReactElement;
}

const FaqSection = ({ title, items }: { title: string; items: FaqItem[] }) => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="poster-card">
      <h2 className="text-2xl font-medium mb-6 text-midnight-koi">{title}</h2>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="border border-pine-shadow-20 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-canvas-cream transition-colors"
            >
              <span className="font-medium text-midnight-koi">{item.question}</span>
              {openItems.has(index) ? (
                <ChevronUp className="text-pine-shadow-60" size={20} />
              ) : (
                <ChevronDown className="text-pine-shadow-60" size={20} />
              )}
            </button>
            {openItems.has(index) && (
              <div className="px-6 py-4 bg-canvas-cream border-t border-pine-shadow-20">
                <div className="prose prose-sm max-w-none text-pine-shadow">
                  {item.answer}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const FaqPage = () => {
  const tipsFaq: FaqItem[] = [
    {
      question: "What is a tip?",
      answer: (
        <div className="space-y-2">
          <p>
            A tip is a way to reward contributors for their work on Polkadot or Kusama. Tips are 
            smaller, more immediate payments compared to treasury proposals, making them perfect for:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Bug fixes and security reports</li>
            <li>Community contributions</li>
            <li>Content creation and educational materials</li>
            <li>Small development tasks</li>
          </ul>
        </div>
      )
    },
    {
      question: "How do tips work?",
      answer: (
        <div className="space-y-2">
          <p>Tips go through OpenGov referendum process:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Someone proposes a tip for a contributor</li>
            <li>The tip goes to a referendum for token holders to vote</li>
            <li>Once approved, the tip is paid out to the beneficiary</li>
          </ol>
          <p>
            Tips use the same democratic process as other treasury spending, ensuring community 
            consensus on rewards.
          </p>
        </div>
      )
    },
    {
      question: "Who can propose a tip?",
      answer: (
        <p>
          Anyone can propose a tip! You don't need any special permissions. If you've seen 
          valuable work that deserves recognition, you can use this tool to propose a tip 
          through OpenGov.
        </p>
      )
    },
    {
      question: "What makes a good tip proposal?",
      answer: (
        <div className="space-y-2">
          <p>A strong tip proposal includes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Clear description of the work completed</li>
            <li>Links to relevant pull requests, posts, or deliverables</li>
            <li>Explanation of the impact or value provided</li>
            <li>Reasonable tip amount based on the work done</li>
          </ul>
        </div>
      )
    }
  ];

  const rfpFaq: FaqItem[] = [
    {
      question: "What is an RFP (Request for Proposal)?",
      answer: (
        <div className="space-y-2">
          <p>
            An RFP is a way to request work from the community with pre-allocated funding. Instead 
            of doing work first and hoping for payment, developers can see available RFPs and know 
            exactly what work is needed and how much it pays.
          </p>
          <p>RFPs are great for:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Feature development</li>
            <li>Infrastructure improvements</li>
            <li>Tools and integrations</li>
            <li>Research and analysis</li>
          </ul>
        </div>
      )
    },
    {
      question: "How do RFPs work?",
      answer: (
        <div className="space-y-2">
          <p>The RFP process involves:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Someone identifies a need and creates an RFP with funding</li>
            <li>The RFP is approved through governance</li>
            <li>Developers submit proposals to complete the work</li>
            <li>Supervisors review and select the best proposal</li>
            <li>Work is completed and payment is released based on milestones</li>
          </ol>
        </div>
      )
    },
    {
      question: "What are supervisors?",
      answer: (
        <p>
          Supervisors are trusted community members who oversee RFP execution. They review 
          proposals, ensure quality standards are met, and approve milestone payments. This 
          protects both the treasury and developers by ensuring clear expectations and fair 
          payment.
        </p>
      )
    },
    {
      question: "How is payment handled?",
      answer: (
        <div className="space-y-2">
          <p>
            RFP payments are milestone-based. When you create an RFP, you define specific 
            milestones with associated payments. Developers receive payment as they complete 
            each milestone, verified by the supervisors.
          </p>
          <p>
            The total funding includes the prize pool for developers, plus fees for finders 
            (who refer talented developers) and supervisors (who manage the process).
          </p>
        </div>
      )
    }
  ];

  const bountyFaq: FaqItem[] = [
    {
      question: "How are RFPs related to bounties?",
      answer: (
        <div className="space-y-2">
          <p>
            RFPs are implemented as bounties on-chain. When you create an RFP, you're actually 
            creating a bounty with a structured process for proposal submission and milestone 
            tracking.
          </p>
          <p>
            This means you can manage your RFPs using existing bounty management tools while 
            benefiting from the structured RFP process.
          </p>
        </div>
      )
    },
    {
      question: "Where can I manage my bounties?",
      answer: (
        <div className="space-y-2">
          <p>You can manage bounties using several tools:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <a 
                href="https://bounties.usepapi.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-lake-haze hover:underline inline-flex items-center gap-1"
              >
                Papi Bounties <ExternalLink size={14} />
              </a>
              {" "}- Modern bounty management interface
            </li>
            <li>
              <a 
                href="https://polkadot.subsquare.io/treasury/bounties" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-lake-haze hover:underline inline-flex items-center gap-1"
              >
                Subsquare <ExternalLink size={14} />
              </a>
              {" "}- Comprehensive governance platform
            </li>
            <li>
              <a 
                href="https://polkadot.polkassembly.io/bounties" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-lake-haze hover:underline inline-flex items-center gap-1"
              >
                Polkassembly <ExternalLink size={14} />
              </a>
              {" "}- Alternative governance interface
            </li>
          </ul>
          <p className="mt-2">
            For example, you can view bounty #37 at:{" "}
            <a 
              href="https://bounties.usepapi.app/bounty/37" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-lake-haze hover:underline"
            >
              https://bounties.usepapi.app/bounty/37
            </a>
          </p>
        </div>
      )
    },
    {
      question: "What's the difference between parent and child bounties?",
      answer: (
        <div className="space-y-2">
          <p>
            <strong>Parent bounties</strong> are the main funding pools created through governance. 
            They hold the total allocated funds and define the overall scope.
          </p>
          <p>
            <strong>Child bounties</strong> are smaller work packages created from parent bounties. 
            They allow breaking down large projects into manageable pieces with individual funding 
            and supervisors.
          </p>
          <p>
            When you create an RFP as a child bounty, it inherits the parent's curator but can 
            have its own specific requirements and milestones.
          </p>
        </div>
      )
    }
  ];

  const generalFaq: FaqItem[] = [
    {
      question: "Do I need DOT/KSM to use this tool?",
      answer: (
        <p>
          Yes, you'll need some DOT (for Polkadot) or KSM (for Kusama) to cover transaction fees 
          and deposits. The tool will show you exactly how much you need before submitting. 
          Deposits are returned when the RFP or tip process completes.
        </p>
      )
    },
    {
      question: "How long does the process take?",
      answer: (
        <div className="space-y-2">
          <p>Process timing varies between networks:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Polkadot Tips/RFPs:</strong> ~28 days for the referendum voting period</li>
            <li><strong>Kusama Tips/RFPs:</strong> ~7 days for the referendum voting period</li>
            <li><strong>Child RFPs:</strong> Can be created immediately if you're a curator (both networks)</li>
          </ul>
          <p className="text-sm mt-2">
            After referendum approval and funding, RFPs enter the submission window where developers can apply.
          </p>
        </div>
      )
    },
    {
      question: "How do submission deadlines work?",
      answer: (
        <div className="space-y-2">
          <p>
            When creating an RFP, you specify a submission deadline - a specific date when proposal 
            submissions close. This must be at least 7 days after the worst-case funding date to 
            give developers adequate time to prepare proposals.
          </p>
          <p>
            The submission deadline is fixed regardless of when the RFP actually gets funded, 
            providing predictability for both RFP creators and potential implementers.
          </p>
        </div>
      )
    },
    {
      question: "Where can I get help?",
      answer: (
        <div className="space-y-2">
          <p>For help and support:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <a 
                href="https://discord.gg/polkadot" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-lake-haze hover:underline inline-flex items-center gap-1"
              >
                Polkadot Discord <ExternalLink size={14} />
              </a>
              {" "}- Join the community for real-time help
            </li>
            <li>
              <a 
                href="https://forum.polkadot.network" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-lake-haze hover:underline inline-flex items-center gap-1"
              >
                Polkadot Forum <ExternalLink size={14} />
              </a>
              {" "}- Discuss proposals and get feedback
            </li>
            <li>Browse existing proposals on Subsquare or Polkassembly for examples</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-12">
      <div className="poster-card">
        <h1 className="text-4xl font-medium mb-6 text-midnight-koi">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-pine-shadow leading-relaxed">
          Everything you need to know about tips, RFPs, and bounty management on Polkadot and 
          Kusama. Click on any question to expand the answer.
        </p>
      </div>

      <FaqSection title="About Tips" items={tipsFaq} />
      <FaqSection title="About RFPs (Requests for Proposals)" items={rfpFaq} />
      <FaqSection title="Bounty Management" items={bountyFaq} />
      <FaqSection title="General Questions" items={generalFaq} />

      <div className="poster-card bg-lake-haze bg-opacity-10 border-lake-haze">
        <h3 className="text-xl font-medium mb-4 text-midnight-koi">Still have questions?</h3>
        <p className="text-pine-shadow mb-4">
          The Polkadot and Kusama communities are always happy to help! Join the discussion 
          channels or browse existing proposals to learn from examples.
        </p>
        <div className="flex flex-wrap gap-4">
          <a 
            href="https://polkadot.subsquare.io" 
            target="_blank" 
            rel="noopener noreferrer"
            className="poster-btn btn-primary inline-flex items-center gap-2"
          >
            Visit Subsquare <ExternalLink size={16} />
          </a>
          <a 
            href="https://bounties.usepapi.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="poster-btn btn-secondary inline-flex items-center gap-2"
          >
            Manage Bounties <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};