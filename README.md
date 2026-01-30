## Inspiration

While job hunting on LinkedIn, I stumbled upon several advertisements encouraging programmers to learn a language I had never heard of... COBOL. I had just finished my schooling and received my certificate in Full Stack Software Development, where I learned to harness languages and frameworks like JavaScript, Python, Django/Flask, SQL, etc. 

Given the path I took when I chose my courses, I knew there would be jobs that called for languages I was not currently adept in (Java, C++, etc.), but I had never even heard of COBOL. So, it made me wonder, **what is COBOL and why was it so high in demand?**

I did some research and learned that COBOL, or Common Business-Oriented Language, is a procedural programming language created in 1959 focused on readability, self-documentation, and ease of use. 

The next thing I needed to know was, **why is COBOL still high in demand?** Well, most government systems, insurance agencies, and banking systems rely on it. This may have motivated a lot of people to learn the COBOL language, get a job, and maintain legacy software. It inspired me to do something else... 

**It inspired me to find a way to solve the "COBOL Dilemma".**

### What is The Cobol Dilemma?

Many COBOL developers are nearing retirement age, and younger coders are less likely to learn it. This means that when problems arise, many companies no longer have a COBOL expert on hand. Given this dilemma, COBOL is still used extensively: **more than 95% of ATM swipes and 43% of banking systems are written in COBOL.**

The average age of a COBOL developer is between 45 and 55, which means they will soon be leaving the workforce. On top of that, there are only an estimated 24,000 COBOL programmers in the US, leaving very few professionals to maintain these legacy systems and creates a need for younger programmers to learn a language they don't want to learn.

Why wouldn't they want to learn it? Well, COBOL is not particularly easy to learn. It's English-like syntax makes the language relatively simple, but mastering it for real-world use is challenging due to complex mainframe environments, legacy systems, and tight integration with specific operating systems and databases.

## What Logic Lift Does

Logic Lift is an autonomous modernization platform designed to solve the "Black Box" Legacy Crisis in critical industries like banking, insurance, and government. It doesn't just translate code; it performs Logic Archaeology to extract buried business rules from 40-year-old COBOL systems and reconstructs them into modern, cloud-native Python architectures on Google Cloud.

In the real world, this solves the multi-billion dollar problem of Migration Risk. Banks are terrified of their mainframes, but they are even more terrified of changing them because they don't know what's inside.
By using Autonomous Verification Loops, the program generates and executes test artifacts that prove the new system behaves exactly like the old one. This eliminates the need for manual logic recovery and drastically reduces the fear of system-wide outages during legacy-to-cloud transitions. 

Logic Lift AI doesn't just offer "migration"; it offers "certainty." By generating documentation and parity tests alongside the code, you are selling the ability to pass a regulatory audit. 

### Core Platform Features

- **Source Ingestion:** A high-capacity portal for uploading or pasting legacy artifacts (COBOL, Copybooks). It uses a "System reasoning" cycle to map the logical topology of the entire codebase before deconstructing it.

- **System Stream:** A real-time terminal log that provides "Mainframe-style" feedback on kernel initialization, reasoning cycles, and diagnostic faults.

![Source Ingestion](/source-ingestion.png)

- **Archaeology (Logic Recovery):** Rather than just translating code, this feature extracts underlying business rules and generates a Persistence Data Map (linking legacy PIC clauses to modern types like Cloud Spanner or SQLAlchemy).

- **Modern Context & Grounding:** Utilizing Google Search grounding, it identifies and displays real-world technical documentation and modern GCP patterns relevant to the specific module being recovered.

- **Progressive Source Implementation:** Generates high-fidelity Python implementations using a streaming effect to simulate deep architectural synthesis.

- **Parity Validation:** Generates a full pytest suite for every module and executes a Parity Cycle (a virtual execution environment) to prove the modern logic behaves identically to the legacy trace.

- **System Blueprint:** A global topology view that explains how the legacy call hierarchy translates into a modern distributed system.

##### **The Bulk Export Button** 

The Bulk Export button is the final step in the migration workflow.
***Once the "Recovery Queue" processes the legacy modules, this feature:***
- Aggregates Results: It scans the system state to identify every module that has reached the DONE status (meaning logic is recovered and implementation is complete).
- Concatenates Source: It merges all individual Python implementations into a single, deployable system queue file.
- Local Handoff: It triggers a browser-level download of a file named system_recovery_queue.py, allowing an engineer to move from the AI environment to a local IDE or a GCP deployment pipeline with one click.
- It is designed to eliminate the "manual copy-paste" friction usually associated with AI code assistants, treating the migration as a unified batch process.

## How I Built it

Legacy Link AI was built by harnessing my prompt engineering skills in Google AI Studio, where I instructed Gemini 3 to build a robust application, powered by Gemini Intelligence. I started with a simple to COBOL to Python converter. 

To ensure the best possible outcome, I built this application in increments, starting with a simple COBOL to Python Converter for banking systems. I focused in on banking systems with the intent to expand to other industries that still rely on COBOL and mainframe environments. I did this because it is always best to work in increments when it comes to AI. I figured once the system was up and running properly, it could be copied by other developers and expanded to other industries. I also imagine there is a bit of red tape to cut through when it comes to government systems. I don't personally have the right scissors to cut through that tape, but I'm sure a company like Google may have some ideas and I believe Legacy Link AI has the potential to expand to other industries. 

#### First Prompt/Feature:

> Create an application that can upgrade and improve a banking system's current codebase, by rewriting all of the system's code from COBOL to Python. The application should be able to handle at least 20,000 lines of code, but should work in increments, to ensure the best possible outcome. The application should perform tests with each update and ensure a scalable, maintainable final codebase is delivered for the bank.

### Google AntiGravity

### Deployment

Logic Link AI was deployed to Google Cloud Platform as a Cloud Run service through Google Build Studio and Google Antigravity. The application can also be accessed and edited via Google Build Studio. 

## Challenges we ran into

### General AI Problems

As with most modern AI programs, I had a few instances where the AI interpreted a prompt incorrectly. However, I was pleasantly surprised to see that Gemini 3 executed the commands I sent effectively and didn't confused my instructions, so much as it decided on its' own to change the name of the application on a few occasions. 

### Logic Extraction Processing Time

Because this application is performing many tasks at the same time, the output isn't instantaneous. 

### Hung Processes

After the first initial prompt and render of Legacy Link, I tested the program using public COBAL samples I found on GitHub (https://github.com/neopragma/cobol-samples). I wanted to emulate a real world scenario, where several files are uploaded at once and an entire system is analyzed. I uploaded 5 files and waited about 10 minutes before noticing the program was getting stuck, or hung. I prompted Gemini with the following:

> I uploaded 5 test files at 11:41 pm EST... I understand it may take some time, but it says 'Current Task' is Completed, but the progress spinner next to 'Current Task' (named Customer Creation Logic BNK1CCS) is still spinning, it appears the Modernization Progress is stuck at 83% (4614 / 5564 LoC), and nothing happens when I click 'Export Artifact'. Does it need more time to render, did I give it too much data, or is their a bug?

The AI responded with,

> I've analyzed the behavior you described. It appears the migration pipeline was halting whenever a specific code chunk encountered a logical error or a timeout, preventing the remaining 17% of your codebase from being processed. I've also implemented the "Export Artifact" functionality which was previously just a UI placeholder.

***Specification of Updates***:
- Resilient Pipeline: Updated the chunk processing logic to continue to the next module even if one fails. This ensures the modernization reaches 100% completion regardless of individual module errors.
Enhanced UI State:
- Replaced the persistent spinner with a CheckCircle once the status reaches COMPLETED.
Added a "Finalizing..." state to provide better feedback during the last few steps.
Updated the "Current Task" widget to show "Migration Finished" upon completion.
- Export Artifact Functionality:
Implemented a handleExport function that aggregates all successfully modernized Python modules into a single downloadable .py file.
- Added a global "Export Entire Project" button next to the progress bar for convenience.
Error Recovery: Added a "Skip/Next" logic in the state management to prevent the "stuck at 83%" scenario.

After these changes were made, the program's performance improved significantly. 

## Accomplishments

## What I Learned

## What's next for Legacy Link AI

To move Logic Link AI beyond an MVP into a **real-world production tool**,  the following additions would be needed:

1. **A Secure Sandbox:** A backend environment to run the generated Python code for real (rather than simulated LLM verification).

2. **Strict Parser Integration:** Combining the LLM with a formal COBOL grammar parser to catch 100% of syntax edge cases.

3. **Persistence:** Integration with a database to save "Migration Projects" so a user can return to a project over several weeks.

### Scalability

Logic Link AI is scalable along along three clear axes:

1. Horizontal (Languages): The same architecture can be scaled to handle PL/I, RPG, or Fortran—the other "zombie languages" of the insurance and energy sectors.

2. Vertical (Integration): Legacy Link AI can be scaled into a "Migration IDE" that connects directly to a bank’s GitHub or GitLab, automatically creating Pull Requests as it "recovers" each module.

3. Deep Tech (The Sandbox): Moving from "simulated verification" to "real-time execution" in GCP Cloud Run sandboxes. This would make the tool an "Autonomous Software Engineer" rather than just a "Translator."
