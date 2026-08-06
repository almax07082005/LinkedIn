---
title: JVM Garbage Collection Tuning: G1 vs ZGC for Low-Latency Java Services in Production
seo_title: JVM Garbage Collection Tuning: G1 vs ZGC in Production
slug: jvm-garbage-collection-tuning-g1-zgc
cover_image: A dark slate-grey canvas, 1200x644, split diagonally. Left half shows a horizontal timeline of a Java request as a thin cyan bar, interrupted by three tall orange vertical blocks labelled "pause". Right half shows the same timeline with the orange blocks reduced to hairlines, and a faint cyan haze running underneath the whole bar to represent concurrent work spread out over time. Bottom-left in small monospace type "G1", bottom-right "ZGC". No stock photos, no laptops, no green matrix text.
cover_alt: Two request timelines compared side by side. On the left, three tall orange bars interrupt the request. On the right, the orange bars are thin hairlines but a faint background haze runs the whole length, showing concurrent collection work traded against pause time.
headings_h1:
  - The latency spike that is not in your code
  - What the JVM actually does with your objects
  - Reading a G1 log like a stack trace
  - Tuning G1 without the cargo cult
  - ZGC and the price of concurrent everything
  - Choosing a collector on purpose
  - The switch, walked end to end
  - What I would tell you before you start
headings_h2:
  - The latency spike that is not in your code / A p99 that moves without a deploy
  - The latency spike that is not in your code / Why "it is the GC" is usually a lazy answer
  - The latency spike that is not in your code / The three numbers that decide it
  - The latency spike that is not in your code / Getting the data out of a production JVM
  - What the JVM actually does with your objects / Allocation is a pointer bump
  - What the JVM actually does with your objects / Regions instead of fixed generations
  - What the JVM actually does with your objects / Young collection: copying is cheap, tracing is not
  - What the JVM actually does with your objects / Humongous objects and the one megabyte cliff
  - What the JVM actually does with your objects / Concurrent marking and the mixed cycle
  - Reading a G1 log like a stack trace / Turning on logging without drowning
  - Reading a G1 log like a stack trace / Anatomy of a young pause
  - Reading a G1 log like a stack trace / To-space exhausted
  - Reading a G1 log like a stack trace / The pause that is not a GC pause
  - Tuning G1 without the cargo cult / MaxGCPauseMillis is a goal, not a promise
  - Tuning G1 without the cargo cult / Why a bigger heap can mean shorter pauses
  - Tuning G1 without the cargo cult / G1HeapRegionSize and the humongous fix
  - Tuning G1 without the cargo cult / The flags I do not touch
  - Tuning G1 without the cargo cult / The real fix was allocation, not the collector
  - ZGC and the price of concurrent everything / Colored pointers and the load barrier
  - ZGC and the price of concurrent everything / Generational ZGC, and why the first version was a trap
  - ZGC and the price of concurrent everything / Allocation stalls are how ZGC falls over
  - ZGC and the price of concurrent everything / What ZGC does not fix
  - Choosing a collector on purpose / The case for staying on G1
  - Choosing a collector on purpose / When I would switch to ZGC
  - Choosing a collector on purpose / Parallel GC is not obsolete
  - Choosing a collector on purpose / The container changes the arithmetic
  - Choosing a collector on purpose / Shenandoah, briefly and honestly
  - The switch, walked end to end / What we changed, in what order
  - The switch, walked end to end / The regression: RSS climbed and the pod died
  - The switch, walked end to end / Proving a GC change actually worked
  - What I would tell you before you start / When GC tuning is the wrong project
  - What I would tell you before you start / What I would do differently
  - What I would tell you before you start / What is still unsolved
blockquotes:
  - If your p99 is 2,000 ms and your worst GC pause in the same window is 60 ms, the collector is not your problem, and you are about to spend a week tuning the wrong subsystem.
  - Copying a live object costs something; a dead object costs nothing at all, because nothing ever visits it.
  - The collector was not short of garbage to reclaim, it was short of contiguous free space to work in at the moment it needed it.
  - Headroom is not waste. It is the working space the algorithm requires.
  - It is not that ZGC does less work. It bills the work differently, and it bills it continuously.
  - Same image, different flags, different objective.
  - The heap graph looked healthy the entire time the container was dying.
  - Tuning the collector is what you do after you have run out of allocations worth deleting.
images:
  - after "Regions instead of fixed generations": Diagram of a G1 heap drawn as a 12x8 grid of equal squares, each square labelled with a single letter - E for eden, S for survivor, O for old, H for humongous, and blank for free. Three adjacent H squares are outlined together to show one humongous object spanning contiguous regions. A caption strip below reads "one 4 GB heap, 2 MB regions, roles assigned per collection". | alt: A grid of equal-sized heap regions labelled eden, survivor, old, humongous and free, with three humongous regions outlined as one contiguous allocation.
  - after "Anatomy of a young pause": Annotated screenshot-style rendering of five lines of G1 unified GC log, with callout arrows pointing at the GC id, the before-and-after heap occupancy, the total heap size, and the pause duration, each labelled with what it tells you. | alt: Five lines of G1 garbage collection log with arrows labelling the collection id, heap occupancy before and after, total heap size and pause duration.
  - after "Why a bigger heap can mean shorter pauses": A two-panel bar chart. Left panel titled "small heap" shows frequent short young pauses plus one very tall full GC bar. Right panel titled "larger heap" shows fewer young pauses of similar height and no full GC bar. Y axis is pause milliseconds, X axis is time. | alt: Two bar charts comparing pause patterns. The small heap shows frequent pauses and one very tall full collection. The larger heap shows fewer pauses and no full collection.
  - after "Colored pointers and the load barrier": Diagram of a 64-bit object reference drawn as a long horizontal bar split into two zones - a small left zone shaded and labelled "metadata bits the collector owns" and a large right zone labelled "the address". Below it, a small flow showing "your code reads a field" going into a box labelled "load barrier" and out to "the object, possibly relocated". | alt: A 64-bit reference split into collector metadata bits and an address, with a flow showing a field read passing through a load barrier before reaching the object.
  - after "The container changes the arithmetic": Diagram of a Kubernetes pod box containing a JVM box, with the JVM box divided into labelled slices - heap, metaspace, thread stacks, code cache, GC structures and direct buffers. An arrow from the pod boundary labelled "memory limit" points at the outside of the JVM box, not at the heap slice. | alt: A pod memory limit drawn around a whole JVM, which is divided into heap, metaspace, thread stacks, code cache, garbage collector structures and direct buffers, showing the limit applies to all of them.
  - after "The regression: RSS climbed and the pod died": A line chart with two series over the same time axis. One series labelled "heap used" oscillates in a healthy sawtooth well below its ceiling. The second series labelled "container RSS" climbs steadily and crosses a dashed horizontal line labelled "memory limit", where a marker reads "OOMKilled". | alt: A chart showing heap usage in a healthy sawtooth pattern while container resident memory climbs steadily and crosses the memory limit, ending in an out-of-memory kill.
words: 9832
characters: 59716
hashtags: #Java #JVM #GarbageCollection #Performance #ZGC
---

Our payment API had a p99 that moved on its own. No deploy, no traffic change, no slow query anywhere in the trace, and yet three or four times an hour a handful of requests took two to three seconds instead of forty milliseconds. The database was bored, the provider was fine, and the application logs had nothing to say about it, because from the application's point of view nothing had happened at all.

This article is about what was actually happening, and about the machinery underneath it. It covers how G1 lays out a heap and decides when to collect it, how to read a GC log and a JFR recording well enough to tell a real GC problem from a fake one, which G1 flags earn their place and which ones are folklore, what ZGC's concurrent design genuinely buys you and what it charges, and how to choose between them for a specific service rather than in the abstract. It is written for backend developers who run Java on JDK 17 or newer in containers and have never had a reason to look below the heap graph. The log lines and numbers here are reconstructed and rounded to show the shape of what we saw, not benchmarks you can reproduce.


The latency spike that is not in your code


A p99 that moves without a deploy

The service was a Spring Boot 3.2 application on JDK 17, running four pods in Kubernetes with a 4 GB memory limit and a 4 CPU limit each. It handled payment operations through an API, and the same deployment also ran a nightly settlement import that pulled provider files, parsed them, and reconciled them against stored operations.

The symptom was narrow and specific, which is the useful kind. Median latency never moved. p95 barely moved. p99 and above went from tens of milliseconds to seconds, in short bursts, and the bursts clustered in the hours when the settlement import was running — but not only then, which is why nobody connected the two for a while.

The first three theories were all reasonable and all wrong. Connection pool exhaustion would have shown up as HikariCP timeouts and a flat CPU graph, and we had neither. A slow downstream would have shown up in the client-side timers we already record per integration. Lock contention would have shown a thread dump full of blocked threads, and the two dumps we grabbed during a spike looked completely ordinary — which, it turns out, is exactly what you would expect, because a thread dump requires a safepoint, and by the time the JVM has reached one, the interesting moment is over.

What finally pointed at the collector was the shape of the distribution. The slow requests were not slow in one place. They were slow uniformly, spread across every endpoint, including one that does nothing but read a value from a local cache and serialize it. When an endpoint with no IO in it takes two seconds, the request did not do more work. The request was stopped.


Why "it is the GC" is usually a lazy answer

I want to be honest about how often this diagnosis is wrong, because "must be garbage collection" is the backend equivalent of "must be the network". It is unfalsifiable if you never look, and it lets you skip the boring work of measuring.

Most of the latency tails I have chased in payment services were not GC. They were a bounded queue draining slower than it filled, a connection pool that held connections through serialization, a retry storm amplifying a single slow provider, or a lock held across an external call. Every one of those produces a long tail, and every one of them is a real bug in code you own, which means fixing it is more valuable than any collector flag.

There is also a specific trap in blaming the collector, which is that GC pauses are one of the few things a pod-level metric will happily show you without context. Every dashboard has a "GC time" panel. It is almost always non-zero. Non-zero is not a problem, and a service doing real work should be spending some measurable fraction of its time collecting. The question is never whether the collector runs, it is whether its pauses land inside your latency budget and whether their distribution matches the shape of your tail.

So the bar I hold myself to before touching a single flag: the pause distribution has to explain the latency distribution. Not correlate loosely — explain. If your p99 is 2,000 ms and your worst GC pause in the same window is 60 ms, the collector is not your problem, and you are about to spend a week tuning the wrong subsystem.


The three numbers that decide it

Three measurements settle the question, and all three are cheap to obtain.

The first is the pause distribution, not the pause average. You want the maximum and the high percentiles of individual stop-the-world pauses, in the same time window as your slow requests. If your worst pause is 3,100 ms and your worst request is 3,400 ms, that is not a correlation, that is an explanation.

The second is allocation rate, in megabytes per second per pod. This is the single most predictive number in the whole exercise, because it drives everything else. A collector's workload is not the size of your heap, it is the rate at which you produce garbage in it. Young collection frequency is roughly eden size divided by allocation rate: with 1 GB of eden and 200 MB/s of allocation you collect about every five seconds, and at 2 GB/s you collect five times a second, with the same code and the same heap.

The third is the fraction of time the application is stopped, which is not identical to time spent in GC. Safepoints happen for reasons other than collection — deoptimization, certain JVMTI operations, thread dumps, heap inspection — and a request can be frozen by a safepoint that has nothing to do with the collector. The unified log will separate these for you if you ask it to, and the difference between "GC pause" and "time threads were stopped" is where a whole class of confusing incidents lives.

Keep the middle one in view for the rest of this article, because it is the term everything else is downstream of. A collector cannot collect faster than you allocate, and 𝗻𝗼 𝗳𝗹𝗮𝗴 𝗶𝗻 𝘁𝗵𝗲 𝗝𝗩𝗠 𝗰𝗵𝗮𝗻𝗴𝗲𝘀 𝗵𝗼𝘄 𝗺𝘂𝗰𝗵 𝗴𝗮𝗿𝗯𝗮𝗴𝗲 𝘆𝗼𝘂𝗿 𝗰𝗼𝗱𝗲 𝗽𝗿𝗼𝗱𝘂𝗰𝗲𝘀.


Getting the data out of a production JVM

You do not need a profiler agent or a restart for any of this. JDK Flight Recorder ships in the JDK, and you can start it on a running process.

    jcmd 1 JFR.start name=diag settings=profile duration=180s filename=/tmp/diag.jfr

    jcmd 1 JFR.dump name=diag filename=/tmp/diag.jfr

The settings=profile preset costs more than the default preset, and the number usually quoted for default is around one percent overhead. I have run profile settings on production payment pods for a few minutes at a time without a visible latency change, but I would not leave it on permanently, and I would not enable it on every pod at once. Start with one pod, take three minutes, and turn it off.

Then read it locally with the jfr tool that comes with the JDK, which nobody seems to know exists:

    jfr summary diag.jfr

    Event Type                              Count   Size (bytes)
    =============================================================
    jdk.ExecutionSample                      9128        328610
    jdk.ObjectAllocationSample               2841        102276
    jdk.GCPhasePause                         1204         46154
    jdk.G1HeapSummary                         382         21392
    jdk.SafepointBegin                       1461         52596
    jdk.GarbageCollection                     191          9932

That summary alone answers question one and question three. jdk.GCPhasePause gives you every individual pause with its duration, and jdk.SafepointBegin gives you every safepoint including the non-GC ones. For question two, jdk.ObjectAllocationSample is the event I reach for most, because since JDK 16 it samples allocations with a bounded, predictable overhead and each sample carries a weight you can turn back into an approximate rate, plus the stack trace that produced it.

    jfr print --events jdk.ObjectAllocationSample --stack-depth 16 diag.jfr

If you would rather stay in your existing dashboards, Micrometer already exposes what you need: jvm.gc.pause as a timer tagged with action and cause, jvm.gc.memory.allocated as a counter you can turn into an allocation rate, and jvm.gc.overhead as a rough fraction. The advantage of JFR is that it hands you the stack traces, and stack traces are what turn "we allocate a lot" into "we allocate a lot here".


What the JVM actually does with your objects


Allocation is a pointer bump

Java allocation has a reputation for being slow that it has not deserved for twenty years. In the common case, allocating an object is incrementing a pointer.

Each thread owns a thread-local allocation buffer, a contiguous chunk carved out of eden. Allocating inside it means bumping the thread's local pointer and checking it against the end of the buffer, with no locking and no free-list search, because nothing else can allocate into that chunk. When the buffer runs out, the thread takes a slower path to claim a fresh one, and only when eden itself is full does a collection start.

Two things fall out of that design that matter in practice. First, allocation cost is nearly independent of object size for small objects, so the intuition that "creating lots of little objects is expensive" is mostly wrong at the allocation site — the cost lands later, at collection time, and it lands in proportion to how many of those objects survive. Second, an object larger than the remaining space in a TLAB, or larger than the TLAB size entirely, is allocated outside it, which is slower and is visible in JFR as jdk.ObjectAllocationOutsideTLAB.

The compiler can also delete the allocation completely. C2 performs escape analysis, and when it can prove an object never escapes the method that created it, it can replace the object with its individual fields held in registers — scalar replacement. This is real and it fires often, which is why micro-optimizing away small short-lived objects usually buys nothing. It also silently stops firing when the allocating method gets too big to inline or the object is stored into a field, which is why "it was fast in the benchmark" and "it allocates in production" can both be true of the same code.


Regions instead of fixed generations

G1 does not lay out the heap as three fixed contiguous spaces. It divides the whole heap into equal-sized regions — a power of two, chosen by ergonomics so that there are roughly 2,048 of them, and clamped between 1 MB and 32 MB on the JDKs I have run this on. A 4 GB heap therefore gets 2 MB regions.

Generations still exist, but as labels rather than places. Each region is, at any moment, eden, survivor, old, humongous, or free, and a region's role changes over time. That is the whole design idea: because the generations are not contiguous, G1 can collect an arbitrary subset of regions in one pause instead of an entire space, and it picks the subset that gives it the most garbage for the least work. The name is Garbage-First, and it means exactly that.

This is also why G1's pause times are tunable in a way the older collectors' were not. If a pause is taking too long, G1 can simply put fewer regions in the next collection set. It cannot do that for old regions without help, which is where the concurrent marking cycle comes in, but for young collections the lever is direct.

The cost of the design is bookkeeping. Because a live object in one region can be referenced from any other region, G1 maintains remembered sets recording incoming references per region, kept up to date by a write barrier on every reference field store your code performs. That barrier is not free, and remembered set maintenance is genuine CPU and memory overhead — on the order of a few percent of heap for the data structures themselves. You pay it constantly so that you can collect a subset cheaply.


Young collection: copying is cheap, tracing is not

A young collection in G1 is a stop-the-world evacuation. It takes the eden and survivor regions, finds the live objects in them, copies those objects into fresh regions, and then declares every source region free in one step.

The important property is that the cost is proportional to what survives, not to what died. Copying a live object costs something; a dead object costs nothing at all, because nothing ever visits it. That inverts the intuition most people bring from manual memory management, where freeing is per-object work. Here, allocating a million short-lived objects that all die before the next collection is close to free at collection time. Allocating a hundred thousand objects that all survive is expensive.

That single fact explains most of the difference between a service that collects happily and one that does not. Request-scoped garbage — DTOs, parsed payloads, string builders, boxed values — is the cheap kind, as long as it actually dies within the request. Anything that outlives the collection gets copied, and if it survives several collections it gets promoted into old, where reclaiming it later requires the much more expensive concurrent machinery.

The failure mode this produces is called premature promotion. If eden is too small relative to your allocation rate, collections happen so often that objects which would have died naturally are still alive when the collector arrives, so they get copied to survivor space, then copied again, then promoted to old. Now old fills with objects that were never long-lived, the concurrent cycle has to run more often to clean them up, and everything gets worse together. The counter-intuitive fix is often to make the young generation larger, not smaller.


Humongous objects and the one megabyte cliff

Here is the mechanism that turned out to be at the center of our incident, and it is one that almost never comes up until it bites.

An object that is at least half the size of a region is a humongous object. It is not allocated in eden at all. G1 finds a run of contiguous free regions large enough to hold it and allocates it directly there, and those regions are accounted as old. On our 4 GB heap with 2 MB regions, that threshold was 1 MB. Any single allocation of one megabyte or more — a byte array holding a provider settlement chunk, a serialized JSON buffer, a large String's backing char storage — skipped the young generation entirely and landed in old.

Several unpleasant things follow. Contiguity is required, so a heap with plenty of free regions scattered around can still fail to place a humongous object, which is fragmentation of exactly the kind region-based collectors were supposed to make rare. The unused tail of the last region is wasted; a 1.1 MB array in 2 MB regions burns 2 MB. And historically the only way to reclaim humongous regions was a concurrent cycle, which means a burst of large short-lived buffers could drive old occupancy up fast enough to trigger collection work that had nothing to do with your actual long-lived data.

Modern G1 does better: it can eagerly reclaim humongous regions during an ordinary young collection when it can determine nothing references them, which helps enormously for the short-lived buffer pattern. But it is an optimization that applies when the conditions hold, not a guarantee you can design against. If your service routinely allocates megabyte-scale arrays, you are allocating into old, and you should know that you are.

The tell is in the log. With heap logging enabled, every collection prints region counts by role, and a humongous count that climbs and drops in large steps is a service doing exactly this.


Concurrent marking and the mixed cycle

Young collections never reclaim old regions, so something has to. In G1 that is the concurrent mark cycle, and it starts when old-generation occupancy crosses a threshold — InitiatingHeapOccupancyPercent, defaulting to 45 percent of the heap, though since JDK 9 G1 adjusts this adaptively based on how quickly it observes old filling up.

The cycle marks live objects concurrently with your application, which creates an obvious problem: the application keeps mutating references while marking is in progress, so an object that was unreachable when marking started might become reachable, or vice versa. G1 solves this with snapshot-at-the-beginning marking. A write barrier records the previous value of every overwritten reference field, so the collector effectively marks against the object graph as it existed when the cycle began. Anything allocated during the cycle is treated as live. That is conservative — it can retain objects that died mid-cycle, so-called floating garbage — and it is the price of not stopping the world to trace a multi-gigabyte heap.

The cycle has two short stop-the-world pauses, Remark and Cleanup, and they are usually small enough to ignore. What it produces is knowledge: which old regions contain mostly garbage. G1 then runs mixed collections — young collections that also include a handful of those old regions in the collection set — until it has cleaned up enough of them.

This is where the whole thing can lose. The concurrent cycle takes real time, mixed collections reclaim old space only gradually, and if your allocation and promotion rates outrun that pipeline, old fills up before the cleanup finishes. When that happens, the collector has nowhere to copy surviving objects, and you get the failure mode I will show in the log next.


Reading a G1 log like a stack trace


Turning on logging without drowning

Unified logging landed in JDK 9 and replaced the old scattered GC flags. The mistake almost everyone makes on the first try is -Xlog:gc*, which enables every GC tag at every level and produces a wall of text that is genuinely hard to read and non-trivial in volume.

This is what I actually run in production, permanently, on every service:

    -Xlog:gc,gc+heap,gc+cpu,gc+ergo*=debug,safepoint:file=/var/log/app/gc.log:utctime,uptime,level,tags:filecount=10,filesize=20M

Breaking that down, because every piece earns its place. The gc tag gives one line per collection, which is the backbone. gc+heap gives the per-role region counts, which is how you see humongous behaviour and how young sizing is moving. gc+cpu gives user, system and real time per pause, and a real time far above user time is a strong hint that your problem is the container's CPU allocation rather than the collector. gc+ergo at debug tells you why G1 made its sizing decisions, which is the difference between tuning and guessing. safepoint gives you every stop, including the ones that are not collections.

The decorators matter as much as the tags. Without utctime you will be correlating GC pauses against application logs by eye, and with uptime you get a monotonic seconds-since-start number that is immune to clock adjustments. File rotation with filecount and filesize keeps this bounded; ten files of 20 MB has never bothered a payment pod in my experience.

Turn this on before you have a problem. GC logging you enabled during an incident tells you about the incident; GC logging that has been running for a month tells you what normal looks like, and that comparison is most of the diagnosis.


Anatomy of a young pause

Here is what an ordinary, healthy young collection looks like on that configuration:

    [2026-03-14T02:11:07.412+0000][312.885s][info][gc      ] GC(1841) Pause Young (Normal) (G1 Evacuation Pause) 2846M->1102M(4096M) 41.238ms
    [2026-03-14T02:11:07.412+0000][312.885s][info][gc,heap ] GC(1841)   Eden regions: 872->0(844)
    [2026-03-14T02:11:07.412+0000][312.885s][info][gc,heap ] GC(1841)   Survivor regions: 26->54(114)
    [2026-03-14T02:11:07.412+0000][312.885s][info][gc,heap ] GC(1841)   Old regions: 388->401
    [2026-03-14T02:11:07.412+0000][312.885s][info][gc,heap ] GC(1841)   Humongous regions: 96->84
    [2026-03-14T02:11:07.413+0000][312.885s][info][gc,cpu  ] GC(1841) User=0.14s Sys=0.01s Real=0.04s

What to notice, in order. The occupancy triple says the heap went from 2,846 MB to 1,102 MB out of 4,096 MB, so this collection reclaimed about 1.7 GB in 41 ms — that is the copying-is-cheap property working exactly as designed. Eden went from 872 regions to zero and the next eden target is 844, slightly smaller, which means G1 is trimming young size to stay inside its pause goal. Survivor grew from 26 to 54 regions, so a meaningful set of objects survived this collection and will be copied at least once more.

The line I care about most is old: 388 to 401. Thirteen regions, 26 MB, got promoted in a single young collection. Multiply by the collection frequency and you have your promotion rate, which is the number that determines how often the concurrent cycle has to run. If old climbs steadily collection after collection and never comes back down, the concurrent cycle is not keeping up, and everything that follows in this section is what that looks like when it fails.

Humongous went 96 to 84, which is eager reclaim doing its job on short-lived large buffers. And User=0.14s against Real=0.04s is the healthy shape: parallel GC threads did 140 ms of CPU work in 40 ms of wall time, meaning they had roughly three and a half cores available. When Real approaches or exceeds User, your GC threads are being throttled by the container and you have a CPU limit problem, not a GC problem.


To-space exhausted

This is the sequence that was destroying our p99, and it is worth reading slowly:

    [2026-03-14T02:47:31.006+0000][2496.479s][info][gc      ] GC(1903) To-space exhausted
    [2026-03-14T02:47:31.006+0000][2496.479s][info][gc      ] GC(1903) Pause Young (Normal) (G1 Evacuation Pause) 3980M->3902M(4096M) 512.771ms
    [2026-03-14T02:47:31.007+0000][2496.480s][info][gc,heap ] GC(1903)   Humongous regions: 402->402
    [2026-03-14T02:47:34.191+0000][2499.664s][info][gc      ] GC(1904) Pause Full (G1 Compaction Pause) 3902M->1421M(4096M) 3182.664ms
    [2026-03-14T02:47:34.191+0000][2499.664s][info][gc,cpu  ] GC(1904) User=11.42s Sys=0.09s Real=3.18s

"To-space exhausted" means G1 started evacuating and ran out of free regions to copy the survivors into. It cannot abandon the collection halfway, so it has to handle the failure: objects that were already copied stay copied, objects that were not get marked in place, and the whole thing costs an order of magnitude more than the pause it replaced. That is the 512 ms line, which reclaimed almost nothing — 3,980 MB to 3,902 MB.

Then the full compaction. Pause Full in G1 means the collector has given up on incremental work and is compacting the entire heap in one stop-the-world operation. It is parallel since JDK 10, which is why it is three seconds rather than ten, but it is still three seconds during which every request in flight is frozen. It did reclaim properly — down to 1,421 MB — which tells you something important: there was plenty of garbage. The collector was not short of garbage to reclaim, it was short of contiguous free space to work in at the moment it needed it.

Look at the humongous count: 402 regions, unchanged across the failed collection. On a 2,048-region heap, humongous objects were occupying about a fifth of it, in old, permanently until a concurrent cycle came around. That is the settlement import, allocating multi-megabyte parse buffers on a shared heap, and squeezing the space G1 needed for evacuation until an ordinary young collection had nowhere to put its survivors.

That is the whole incident in five log lines. Everything before this section was how to get here; everything after is what to do about it.


The pause that is not a GC pause

While we were in the logs, the safepoint tag turned up a second, unrelated problem, and it is a good illustration of why the third measurement from part one matters.

    [2026-03-14T03:02:11.884+0000][3377.357s][info][safepoint] Safepoint "G1CollectForAllocation", Time since last: 998123456 ns, Reaching safepoint: 8412 ns, At safepoint: 41238123 ns, Total: 41246535 ns
    [2026-03-14T03:14:52.331+0000][4137.804s][info][safepoint] Safepoint "ThreadDump", Time since last: 41221093 ns, Reaching safepoint: 412885331 ns, At safepoint: 1204551 ns, Total: 414089882 ns

The first line is our 41 ms young collection, and the interesting field is "Reaching safepoint: 8412 ns" — 8 microseconds for all threads to come to a stop. That is healthy.

The second line is not a garbage collection at all. It is a thread dump, and it took 414 ms in total, of which 412 ms was spent waiting for threads to reach the safepoint. The operation itself took 1.2 ms. Every application thread was frozen for 414 ms because one thread took that long to notice it had been asked to stop.

Threads reach safepoints at defined polling points — method returns, loop back-edges and similar. A thread executing a long-running counted loop with no allocation and no calls historically had no poll inside it, so the JVM had to wait for the loop to finish. Modern HotSpot mitigates this with loop strip mining, which effectively chunks such loops so a poll happens periodically, but you can still hit long time-to-safepoint from JNI calls returning, from very large array copies, and from pathological generated code.

The practical point is narrower than the mechanism. If your latency tail does not line up with GC pauses, look at total safepoint time before you conclude the collector is innocent, because "the application was stopped" and "the collector was running" are different statements and only one of them explains a frozen request.


Tuning G1 without the cargo cult


MaxGCPauseMillis is a goal, not a promise

MaxGCPauseMillis defaults to 200 ms and it is the only G1 flag I would call genuinely important. It is also the most misunderstood, because it does not do what its name suggests.

G1 keeps a model of how long collection work takes: how much time per region evacuated, how much per remembered set scanned, how long fixed costs run. Before each young collection it uses that model to choose how many eden regions it can afford to include and still finish inside the goal. After the collection it feeds the actual measured time back in and refines the model. That is the entire mechanism.

So lowering the goal does not make the collector faster. It makes the young generation smaller, so each pause has less to copy. That works — until it does not. A smaller eden means more frequent collections, more frequent collections mean objects get visited by the collector earlier in their lives, and objects visited earlier are more likely to still be alive, so survivor traffic and promotion into old both increase. Push the goal low enough and you have converted a pause-length problem into a promotion problem, which resurfaces as concurrent cycles that cannot keep up and, eventually, as the full GC from the previous section.

There is also a floor. Some of the pause is fixed cost that does not shrink with a smaller collection set, so setting MaxGCPauseMillis=10 on a service allocating a gigabyte per second does not produce 10 ms pauses. It produces a collector permanently missing its goal, shrinking young to its minimum, and thrashing.

My rule: set it to something your latency budget actually needs, not to the smallest number you can type. On the API pods we set 100. On the batch pods we left it at 200, and I will explain why in part six.


Why a bigger heap can mean shorter pauses

This is the least intuitive thing in the whole subject and the fix that helped us most, so it is worth spelling out mechanically.

Adding heap does not make young collections slower, because young collection cost is driven by surviving bytes, not by heap size. What adding heap does is give the collector more room to be lazy: eden can be larger, so objects have longer to die before anyone looks at them; more objects die before collection, so fewer get copied and fewer get promoted; old fills more slowly, so the concurrent cycle runs less often and has more slack when it does run; and there is more free space available for evacuation, so to-space exhaustion becomes far less likely.

That last one is the direct link to our incident. Evacuation failure is not caused by having too much garbage, it is caused by having too little free space at the instant the collector needs somewhere to copy survivors. Headroom is not waste. It is the working space the algorithm requires.

The counter-argument is real and you should hear it: a larger heap means a longer full GC if you ever have one, and a larger live set means longer concurrent marking. Both are true. But full GC in G1 is meant to be an emergency, and if you are having them regularly, the answer is to stop having them, not to keep the heap small so they hurt less when they happen.

We went from 4 GB to 6 GB on the pods running the import, with the pod memory limit raised accordingly. Evacuation failures went to zero. Not reduced — zero, across the following weeks. The pause count went down as well, because young collections became less frequent, which is the opposite of what most people expect from a bigger heap.


G1HeapRegionSize and the humongous fix

Now the region size, which is one of the few structural flags worth overriding deliberately.

The humongous threshold is half a region, and region size is chosen by ergonomics to give roughly 2,048 regions. That means the threshold moves when your heap size moves, which is a genuinely strange property to have governing your allocation behaviour: the same code with the same 1.5 MB buffers is humongous on a 4 GB heap with 2 MB regions and ordinary on a 16 GB heap with 8 MB regions.

Setting it explicitly makes the behaviour stable:

    -XX:G1HeapRegionSize=8m

With 8 MB regions, the humongous threshold rises to 4 MB, and our settlement parse buffers stopped being humongous. They went back to being allocated in eden, dying there, and costing nothing. The humongous region count in the log dropped from the low hundreds to single digits.

The trade-off is not free and I want to be precise about it. Larger regions mean fewer of them, and fewer regions mean coarser granularity for the collection set, so G1 has less freedom to hit a tight pause goal. Larger regions also waste more in the tail of a partially-filled humongous region when you do allocate one. Going the other way, smaller regions give finer control but more per-region bookkeeping and a lower humongous threshold, which is usually the wrong direction for services that handle files or large payloads.

The way I decide: find your largest routine allocation from the JFR allocation samples, and pick a region size at least four times that, so the threshold sits comfortably above it. Then check the humongous region count in the log to confirm it worked. Do not set this flag because a blog post told you to; set it because you looked at your allocation profile and found something sitting on the wrong side of the cliff.


The flags I do not touch

The internet's G1 tuning lists are mostly a decade old and were written for JDK 8, where G1 was younger and dumber. On JDK 17 and later, most of those flags either do nothing useful or actively fight the adaptive machinery.

• Fixed young generation size, whether through the explicit young size flags or by pinning G1NewSizePercent and G1MaxNewSizePercent together. Fixing young size disables the pause-time model's main lever. The whole point of G1 is that it resizes young to hit your goal; pin it and you have a worse Parallel GC.

• ParallelGCThreads and ConcGCThreads, unless you have measured that the defaults are wrong for your container. The defaults derive from available processors, and if that number is wrong the fix is to make the JVM see the right processor count, not to hardcode thread counts that will be wrong again on the next node type.

• InitiatingHeapOccupancyPercent, in most cases. G1 has adjusted this adaptively since JDK 9 based on observed allocation and marking rates. Setting it manually turns the adaptive behaviour off. There is one real exception: if your live set genuinely exceeds the threshold at steady state, adaptive IHOP has nothing sensible to do and a manual value is warranted.

• Anything described as experimental that requires unlocking. If you need -XX:+UnlockExperimentalVMOptions to set it, you are outside the tested configuration space, and you should have a measurement that justifies it rather than a forum post.

The two I do set beyond what is above: -XX:+AlwaysPreTouch on services where a predictable first minute matters more than a fast start, because it commits and touches the whole heap up front instead of paying page faults during traffic, and -XX:+UseStringDeduplication on services that hold many duplicate strings, which for a payment system full of repeated currency codes, status names and merchant identifiers is a real reduction in live set for a small concurrent cost.


The real fix was allocation, not the collector

The bigger heap and the region size both helped. Neither was the fix.

The JFR allocation samples pointed at one stack, and it was the settlement importer. The code read a provider file, and for each record it loaded the corresponding operation entity, along with a couple of associations, to compare a handful of fields:

    for (SettlementRecord record : parser.parse(file)) {
        Operation operation = operationRepository.findByExternalId(record.externalId());
        if (operation == null) {
            unmatched.add(record);
            continue;
        }
        if (operation.getAmount().compareTo(record.amount()) != 0
                || operation.getStatus() != record.status()) {
            mismatches.add(new Mismatch(operation, record));
        }
    }

Two problems, and only one of them is visible. The obvious one is that every iteration hydrates a full entity graph to read two fields, which is a lot of bytes for very little information. The invisible one is worse: every one of those entities becomes managed in the persistence context and stays there for the whole transaction, so the live set grows linearly with the file, everything in it survives every young collection, and all of it gets promoted into old. This is a machine for producing promotion.

The rewrite reads what it needs and nothing else:

    try (Stream<SettlementProjection> rows = operationRepository.streamByExternalIdIn(batchIds)) {
        rows.forEach(row -> {
            SettlementRecord record = recordsById.get(row.externalId());
            if (row.amount().compareTo(record.amount()) != 0
                    || row.status() != record.status()) {
                mismatches.add(Mismatch.of(row, record));
            }
        });
        entityManager.clear();
    }

A projection interface instead of an entity, batched by id instead of one query per record, and an explicit clear so the persistence context does not accumulate. What matters for this article is not the JPA technique, it is the effect on the collector: the allocations became small, short-lived, and confined to eden, where they died before anyone looked at them. Allocation rate dropped, promotion dropped much further, the concurrent cycle went back to running on its own schedule instead of chasing a filling old generation, and the p99 spikes stopped.

The collector flags stayed in, because they are good defaults for this workload and they make the failure mode less likely to return. But if I had only changed the flags, I would have moved the cliff a bit further away and called it fixed, and the next volume increase would have walked us straight back over it.


ZGC and the price of concurrent everything


Colored pointers and the load barrier

Everything so far has been about making stop-the-world pauses shorter. ZGC takes a different position: do essentially all of the work concurrently, and keep pauses in the sub-millisecond range regardless of heap size.

That is an enormous claim, because the hard part of concurrent collection is not marking, it is moving. If the collector relocates an object while application threads hold references to its old address, those references are now wrong. G1 avoids the problem by doing all relocation inside a stop-the-world pause. ZGC cannot, so it needs a way to fix references as the application encounters them.

The mechanism is colored pointers plus a load barrier. A 64-bit reference does not need all 64 bits to address the heap, so ZGC stores collector metadata in the spare bits of the reference itself — information about whether the object has been marked in the current cycle and whether the pointer has been remapped since the last relocation. Then every read of a reference field from the heap passes through a load barrier: a short inlined check of those bits, which in the common case confirms the pointer is good and proceeds, and in the uncommon case fixes it on the spot, updating the reference in memory so the next read is fast.

That is the trade in one sentence. G1 pays a write barrier on reference stores to maintain remembered sets, and pays for relocation with pause time. ZGC pays a load barrier on reference reads, and pays for relocation with throughput spread thinly across every read your application performs. It is not that ZGC does less work. It bills the work differently, and it bills it continuously.

The result is what the design promised. ZGC pauses do not scale with heap size or live set size — the remaining stop-the-world points are bounded root-scanning operations, and concurrent thread-stack processing removed the last part that scaled with thread count. Sub-millisecond pauses on a heap of any size is a genuine, measurable property, not marketing.


Generational ZGC, and why the first version was a trap

The original ZGC was not generational. It collected the whole heap every cycle, with no separate young generation, because building a concurrent generational collector is considerably harder than building a concurrent single-generation one.

That decision has a specific consequence, and it is the one that bit teams who tried ZGC early on allocation-heavy services. The weak generational hypothesis — most objects die young — is what makes young collection cheap in G1: you look only at the region where the young objects live, and you skip everything else. A non-generational collector cannot skip anything. Every cycle traverses the whole live set, including the long-lived data that has not changed in an hour, so the cost per cycle is proportional to total live data rather than to recently-allocated data.

For a service with a small live set and moderate allocation, that is fine. For a service that allocates hard against a multi-gigabyte live set — which describes most payment services during a batch window — it means the collector is doing repeated full traversals just to reclaim the short-lived request garbage that G1 would have handled in a 40 ms young pause. The pauses stay tiny, exactly as advertised, and the CPU cost and the collection frequency both go up sharply.

Generational ZGC, JEP 439, landed in JDK 21 behind -XX:+ZGenerational. It became the default in JDK 23 and the non-generational mode was removed in JDK 24. It adds a young generation with the usual property that most collections only look at recently allocated objects, and it needs store barriers in addition to load barriers to track references from old objects into young ones — the same problem G1 solves with remembered sets, solved differently.

The practical guidance is blunt. On JDK 21 or 22, enable ZGC only with the generational flag. On JDK 23 or later, you get it automatically. If you evaluated ZGC before JDK 21 and concluded it burned CPU, that conclusion is now out of date, and it is worth re-running the experiment.


Allocation stalls are how ZGC falls over

Every collector has a way of failing when allocation outruns collection. G1's is evacuation failure and the full compaction pause. ZGC's is the allocation stall, and it looks completely different in the logs, which is why people miss it.

    [2026-04-02T01:14:22.118+0000][info][gc] Allocation Stall (payment-worker-7) 42.118ms
    [2026-04-02T01:14:22.161+0000][info][gc] Allocation Stall (http-nio-8080-exec-24) 39.882ms
    [2026-04-02T01:14:22.204+0000][info][gc] GC(214) Major Collection (Allocation Rate) 3894M(95%)->1204M(29%)

ZGC has no stop-the-world pause to fall back on. When a thread wants memory and there is none available because the concurrent collector has not finished freeing it yet, that thread simply waits. Your pause metric stays beautiful — the pauses genuinely are sub-millisecond — and your requests are nonetheless blocked, because they are stalled in allocation, not stopped at a safepoint.

This is the single most important operational fact about running ZGC. If you monitor only pause duration, ZGC will look perfect right up until the service is unusable. You have to grep for allocation stalls, or you are not monitoring the thing that actually goes wrong.

The fixes are the same family as always: more heap headroom, so the concurrent collector has more time before the application runs dry; more CPU for the concurrent GC threads, since they need to complete a cycle in the time it takes the application to fill the remaining space; and less allocation, which is the fix that works for every collector ever written. There is also SoftMaxHeapSize, which tells ZGC to try to stay under a soft ceiling and collect more eagerly, while leaving the hard maximum available as a buffer for bursts. It is a genuinely useful knob and it has no G1 equivalent.


What ZGC does not fix

ZGC eliminates pause time as a source of latency. It does not eliminate the other things people hope it will.

It does not reduce your allocation rate, and it does not reduce your live set. A service that allocates 2 GB per second still allocates 2 GB per second, and the collector still has to reclaim all of it — concurrently, using CPU that your request threads would otherwise have. If your pods are CPU-constrained, moving GC work off pauses and onto concurrent threads can make throughput worse in exchange for a better tail, and that is a trade you should make knowingly.

It does not fix long time-to-safepoint. The few remaining ZGC pauses are short, but if a thread takes 400 ms to reach a safepoint, everything still waits 400 ms. Safepoint problems are orthogonal to the collector.

It does not fix memory leaks, and it makes them slightly harder to spot, because the classic symptom of a leak under G1 — full GCs that reclaim less and less — does not present the same way. Under ZGC you see collection frequency rising and allocation stalls appearing, which reads more like a load problem than a leak.

And it does not come free in footprint. ZGC needs more heap headroom than G1 to work comfortably, and its own metadata is not small. That was the regression I will describe in part seven, and it was entirely predictable in hindsight.


Choosing a collector on purpose


The case for staying on G1

G1 is the default from JDK 9 onward for server-class machines, and defaults deserve respect: it is the configuration that receives the most testing, the most production hours, and the most tooling support in the entire ecosystem.

For the majority of Spring Boot services I have worked on, G1 is the right answer and no one should be spending a sprint on this. If your heap is a few gigabytes, your pause goal is a couple of hundred milliseconds, your service is not latency-critical below the 100 ms mark, and your CPU budget is modest, G1 will do a completely adequate job with no flags beyond a heap size.

G1 also has two practical advantages that rarely make the comparison tables. Its throughput cost is lower than ZGC's, because a write barrier on reference stores is cheaper in aggregate than a load barrier on reference reads for most object graphs, and because collecting a young region set is less total work than concurrently traversing a live set. And its failure mode, while ugly, is loud: a full GC in the log is unmistakable, whereas an allocation stall is a line you have to know to look for.

If I inherited a service with a latency problem and no measurements, my order of operations would be: fix the allocation, then size the heap properly, then set a pause goal that reflects the actual budget, and only then consider a different collector. In most cases the fourth step never arrives.


When I would switch to ZGC

There are cases where G1 cannot get there, and they have a recognizable shape.

The clearest is a large heap with a large live set. G1's pause time is driven by how much survives a collection and by how much old-region work a mixed collection takes on, and both scale with the live set. On a heap of tens of gigabytes with a live set to match, "a couple of hundred milliseconds" stops being achievable and the pause distribution develops a tail that no goal setting will remove. ZGC's pauses do not scale with either, which is precisely the property you are buying.

The second is a hard latency requirement in the tens of milliseconds. If a 200 ms pause is a contractual problem rather than an annoyance — a trading path, a real-time bidding endpoint, a payment authorization with a strict provider timeout — then a collector that occasionally stops the world for longer than your whole budget is simply the wrong tool, regardless of how rarely it happens.

The third is a service where the pause distribution is the dominant term in the latency distribution and you have already fixed allocation. This is the honest version of the previous two: you measured, the tail is GC, the code is clean, and you have CPU headroom to spend.

The precondition for all three is that CPU headroom. ZGC needs concurrent GC threads that can actually run, and on a pod with a tight CPU limit, giving the collector more concurrent work is how you turn a pause problem into a throughput problem.


Parallel GC is not obsolete

Parallel GC gets treated as legacy, and for latency-sensitive services it is. For throughput-oriented work it is frequently still the best choice, and I say that having measured it on the batch side of exactly the service in this article.

Parallel GC does everything in stop-the-world pauses, with no concurrent phases and no barriers beyond the minimum. That means no write barrier maintaining remembered sets, no load barrier on reads, and no concurrent threads competing with application threads for CPU. For a batch job whose success criterion is wall-clock completion time, pauses cost nothing that matters — nobody is waiting on a p99 — and the throughput advantage is real.

So: on the pods that serve API traffic, a low-pause collector. On the pods that run the settlement import, -XX:+UseParallelGC, a generous heap, and no pause goal at all. Same image, different flags, different objective. If your batch work and your API traffic share a deployment, that is worth reconsidering for this reason alone — not just for isolation, but because they want genuinely different collectors.

The version of this argument I do not accept is "Parallel GC because it is simpler". Simplicity is not the criterion. Throughput on work where latency does not matter is the criterion, and if that describes your workload, the old collector is not a compromise.


The container changes the arithmetic

Everything above assumes the JVM knows what machine it is on, and in a container it very often does not.

The JVM picks its default collector by ergonomics, and the definition of a server-class machine is at least two available processors and at least about 1,792 MB of memory. Below either threshold it silently selects Serial GC. A pod with a CPU limit of 1, or of 1,500 millicores that rounds down, gets Serial GC, and nobody is told. I have seen a team spend a week on G1 tuning for a service that was not running G1.

    java -XX:+PrintFlagsFinal -version | grep -E 'UseG1GC|UseSerialGC|UseParallelGC|UseZGC'

Run that inside your actual container image with your actual resource limits, not on your laptop. It takes ten seconds and it removes an entire category of wasted effort.

The processor count also drives GC thread counts. Parallel GC threads default to the available processor count up to eight, and grow more slowly above that; concurrent GC threads default to roughly a quarter of that. Available processors is derived from the cgroup CPU quota, so a fractional limit rounds up to a small integer and your collector runs with far fewer threads than the node has cores. That is correct behaviour — the container really cannot use more — but it means GC capacity is set by your CPU limit, and cutting CPU limits to save cost is also cutting the collector's ability to keep up.

And the memory limit applies to the whole process, not the heap. Heap, metaspace, thread stacks, code cache, GC metadata and direct buffers all count toward what the kernel measures. -XX:MaxRAMPercentage sizes the heap as a fraction of the container limit, and the remaining fraction is not spare — it is where everything else lives.


Shenandoah, briefly and honestly

I have not run Shenandoah in production, so I will keep this short and mark it as what it is: a summary of the design, not experience.

Shenandoah is Red Hat's concurrent collector, available in most OpenJDK builds. Like ZGC it performs concurrent evacuation and targets pause times independent of heap size, and it uses load reference barriers to keep application threads seeing correct references while objects move. The designs converged over time on similar answers to the same problem. Historically Shenandoah was strongest on smaller heaps, where ZGC's metadata overhead was proportionally larger, and generational Shenandoah has been in progress rather than shipping as a stable default.

If you are on a Red Hat JDK build and already have Shenandoah support and expertise available to you, it is a legitimate option and the reasoning in this article about when to want a concurrent collector applies to it unchanged. If you are choosing from scratch on a mainstream JDK build, ZGC has more production mileage in the ecosystem I work in, and I would start there. That is a statement about what I can support at three in the morning, not a technical verdict.


The switch, walked end to end


What we changed, in what order

Order matters more than the individual changes, because each one changes the measurement you would use to evaluate the next.

First, we turned on GC logging and JFR everywhere and did nothing else for a week. That week is what produced every number in this article, and it is the step people skip. Without a baseline of what normal looks like, every subsequent change is evaluated against a memory.

Second, we fixed the allocation in the settlement importer. Projections instead of entities, batched queries, explicit persistence context clearing. This was the largest single improvement and it was not a GC change at all.

Third, we split the flags by workload. The API pods went to a 6 GB heap with an explicit region size and a 100 ms pause goal:

    -XX:+UseG1GC
    -XX:MaxRAMPercentage=70
    -XX:G1HeapRegionSize=8m
    -XX:MaxGCPauseMillis=100
    -XX:+UseStringDeduplication
    -Xlog:gc,gc+heap,gc+cpu,gc+ergo*=debug,safepoint:file=/var/log/app/gc.log:utctime,uptime,level,tags:filecount=10,filesize=20M

The batch pods went to Parallel GC with a larger heap and no pause goal, for the reasons in part six.

Fourth, and only fourth, we trialled ZGC on the API pods, on JDK 21 with the generational flag, on one pod out of four for a week with the same JFR recording running. The measurement question was narrow: does the pause contribution to p99 drop enough to justify the CPU and footprint cost, given that allocation is already fixed.

The answer was yes for the tail and no for the total. Pauses effectively vanished from the distribution. p99 improved by a few milliseconds, because after the allocation fix, pauses were no longer the dominant term. We kept G1.


The regression: RSS climbed and the pod died

The ZGC trial did produce one genuine incident, and it is the most useful thing that came out of the whole exercise.

Three days into the trial, the ZGC pod started getting OOMKilled — exit code 137, no OutOfMemoryError, no heap dump, the kernel taking the process out from underneath the JVM. Meanwhile the heap graph was completely healthy: heap used oscillated between 1.5 and 3 GB against a 4.2 GB maximum, with no upward trend at all. The heap graph looked healthy the entire time the container was dying.

The cause was that we had carried over -XX:MaxRAMPercentage=70 from the G1 configuration without thinking about it. That percentage was chosen with G1's off-heap footprint in mind. ZGC keeps more metadata, wants more headroom to run its concurrent cycle comfortably, and is generally less willing to operate close to its ceiling. Seventy percent of the container for heap left too little for the rest, and the rest was bigger than it used to be. Nothing in the JVM's own view of the world was wrong, which is exactly why the heap graph stayed clean.

Two changes fixed it. We dropped MaxRAMPercentage, giving the non-heap side real room. And we set a soft ceiling:

    -XX:+UseZGC
    -XX:+ZGenerational
    -XX:MaxRAMPercentage=55
    -XX:SoftMaxHeapSize=2g

SoftMaxHeapSize tells ZGC to try to keep the heap under 2 GB by collecting more eagerly, while leaving the hard maximum available for genuine bursts. It is a good tool for containers specifically, because it lets you separate "the size I want you to run at" from "the size you may reach before failing", which a single -Xmx cannot express.

The generalizable lesson: GC flags are not portable across collectors. A memory percentage tuned for one collector's footprint is an assumption about that collector, and carrying it across is how a switch that should have been neutral becomes an incident.


Proving a GC change actually worked

The last piece is measurement discipline, because GC changes are unusually easy to fool yourself about.

Change one thing at a time and give it a full business cycle. Our load has a daily shape and a monthly shape — settlement runs, month-end volume — and a change that looks great on a Tuesday can fall over on the last day of the month. A week is the minimum honest evaluation window for a service with daily periodicity.

Compare distributions, not averages. Mean pause time is nearly useless here, because the entire problem is the tail. I look at the maximum pause, the count of pauses above a threshold that matters to the service, and the count of full GCs or allocation stalls, which should be zero.

Watch the metrics that reveal the failure mode of the collector you are actually running, not the previous one. Under G1: full GC count and evacuation failure count. Under ZGC: allocation stall count and total stall time. These are not interchangeable, and monitoring the wrong pair is how the ZGC pod looked perfect on the dashboard while it was being killed.

Run both configurations at once if your deployment allows it. One pod out of four on the new flags, same traffic through the same load balancer, same recording, same window. That comparison is worth more than any amount of reasoning about what should happen, and it costs you a single pod.


What I would tell you before you start


When GC tuning is the wrong project

I have spent a fair amount of this article on flags, so let me be clear about how rarely they are the answer.

If you have not measured, GC tuning is the wrong project. You will change a flag, the number will move for unrelated reasons, and you will have learned nothing while acquiring a configuration you cannot justify.

If your allocation rate is high because of code you can fix, GC tuning is the wrong project. Entities where projections would do, string concatenation in a hot loop, logging that builds messages it then discards below the log level, response objects materialized in full when they could be streamed — all of these produce garbage the collector then has to handle, and deleting the allocation is strictly better than making the collector faster at cleaning it up.

If your p99 is dominated by IO, queueing or lock contention, GC tuning is the wrong project, and the measurements in part one will tell you that in an afternoon.

And if your service is comfortably inside its latency budget, GC tuning is the wrong project even if the graphs are interesting. A collector configuration nobody understands is a liability that outlives whoever set it.

Tuning the collector is what you do after you have run out of allocations worth deleting.


What I would do differently

Three things, in order of how much time they would have saved.

I would have turned on GC and safepoint logging on day one of the service's life, not during the incident. It costs a few megabytes of disk and effectively nothing in CPU, and it converts "what happened at 02:47" from an investigation into a grep. This is the cheapest observability in the entire JVM and it is off by default.

I would have separated the batch workload from the API workload much earlier, and not for the reason we eventually did it. We split them for GC reasons, but the more fundamental point is that they have different objectives — one wants throughput and does not care about pauses, the other wants a tight tail and can spend CPU to get it. Two workloads with opposite objectives sharing a heap will always make one of them worse.

And I would have checked which collector was actually running before tuning anything. It sounds too obvious to state, but the container ergonomics I described in part six are real, they are silent, and I have watched competent people tune a collector that was not in use. One command, at the start, in the real image.


What is still unsolved

I do not want to end on a tidy note, because a few of these are genuinely open.

Sizing a JVM in a container is still guesswork at the margins. There is no single number that tells you how much non-heap memory your process will use, because it depends on thread count, on direct buffer usage in your HTTP and Kafka clients, on metaspace growth from proxies and generated classes, and on the collector's own metadata. In practice everyone arrives at a percentage by watching RSS and backing off, which works but is not a method.

Batch and interactive workloads still do not coexist well in one JVM. Splitting them into separate deployments is the answer we used, and it is the right answer, but it is an operational workaround for the fact that the heap has one configuration and two conflicting sets of requirements. Nothing in the current collector landscape solves that inside a single process.

And the observability gap around allocation stalls bothers me. Pause time is a first-class metric everywhere — every dashboard, every APM, every default Micrometer binder. Allocation stall time is not, and it is the thing that goes wrong under ZGC. As more services move to concurrent collectors, monitoring built around pause duration is going to keep reporting green while requests wait, and that is a mismatch the tooling has not caught up with.

What does your GC configuration look like — default G1 with a heap size and nothing else, a tuned set of flags you could defend line by line, or ZGC because the tail finally forced the issue? And if you have switched collectors in production, did the improvement survive contact with a real traffic peak, or did it just move the problem somewhere your dashboard was not looking?

#Java #JVM #GarbageCollection #Performance #ZGC

--- SHARE POST ---

Our payment API had a p99 that moved on its own — no deploy, no slow query, and an endpoint with zero IO taking two seconds.

It was the garbage collector, but not in the way I expected, and the fix was not a flag.

I wrote up the whole path: how G1 actually lays out a heap, how to read a GC log well enough to tell a real problem from a fake one, which flags earn their place and which are folklore, what ZGC's load barriers genuinely buy you, and the OOMKill we caused by carrying one memory percentage across a collector switch.

What does your GC config look like — default G1 and nothing else, or flags you could defend line by line? 👇

#Java #JVM #GarbageCollection #Performance #ZGC
