-------------------------------------
Translated Report (Full Report Below)
-------------------------------------
Process:             PhilovonFreisinn [52554]
Path:                /Users/USER/Library/Developer/CoreSimulator/Devices/0142B3C6-1A4A-4584-8A98-C792E87DFCDD/data/Containers/Bundle/Application/F5EBD18C-E7CE-464C-BC35-BBDD2B698C97/PhilovonFreisinn.app/PhilovonFreisinn
Identifier:          berlin.cypherpunkacademy.ragapp
Version:             1.0.0 (1)
Code Type:           ARM-64 (Native)
Role:                Foreground
Parent Process:      launchd_sim [15429]
Coalition:           com.apple.CoreSimulator.SimDevice.0142B3C6-1A4A-4584-8A98-C792E87DFCDD [1363]
Responsible Process: SimulatorTrampoline [15419]
User ID:             501

Date/Time:           2026-08-23 10:49:01.7649 +0200
Launch Time:         2026-08-23 10:12:04.9996 +0200
Hardware Model:      MacBookPro18,4
OS Version:          macOS 26.3 (25D125)
Release Type:        User

Crash Reporter Key:  DBCD073F-0252-52E5-2F74-24875E97A8A0
Incident Identifier: F84B3C1E-4BDE-4D5A-B28E-E4ED6B3E5387

Sleep/Wake UUID:       04462BF1-759F-4070-A94B-393E5F769F66

Time Awake Since Boot: 270000 seconds
Time Since Wake:       56234 seconds

System Integrity Protection: enabled

Triggered by Thread: 2  com.facebook.react.runtime.JavaScript

Exception Type:    EXC_BAD_ACCESS (SIGBUS)
Exception Subtype: KERN_PROTECTION_FAILURE at 0x000000016e2a7ff8
Exception Message: Thread stack size exceeded due to excessive recursion
Exception Codes:   0x0000000000000002, 0x000000016e2a7ff8

Termination Reason:  Namespace SIGNAL, Code 10, Bus error: 10
Terminating Process: exc handler [52554]


VM Region Info: 0x16e2a7ff8 is in 0x16e2a4000-0x16e2a8000;  bytes after start: 16376  bytes before end: 7
      REGION TYPE                    START - END         [ VSIZE] PRT/MAX SHRMOD  REGION DETAIL
      CoreAnimation               16e2a0000-16e2a4000    [   16K] r--/r-- SM=PRV  
--->  STACK GUARD                 16e2a4000-16e2a8000    [   16K] ---/rwx SM=NUL  stack guard for thread 2
      Stack                       16e2a8000-16e3b0000    [ 1056K] rw-/rwx SM=PRV  thread 2

Thread 0::  Dispatch queue: com.apple.main-thread
0   libsystem_kernel.dylib        	       0x102834b70 mach_msg2_trap + 8
1   libsystem_kernel.dylib        	       0x10284590c mach_msg2_internal + 72
2   libsystem_kernel.dylib        	       0x10283cc10 mach_msg_overwrite + 480
3   libsystem_kernel.dylib        	       0x102834ee4 mach_msg + 20
4   CoreFoundation                	       0x18041ab60 __CFRunLoopServiceMachPort + 156
5   CoreFoundation                	       0x180415224 __CFRunLoopRun + 1160
6   CoreFoundation                	       0x180414960 CFRunLoopRunSpecific + 536
7   GraphicsServices              	       0x190183b10 GSEventRunModal + 160
8   UIKitCore                     	       0x185aa2b40 -[UIApplication _run] + 796
9   UIKitCore                     	       0x185aa6d38 UIApplicationMain + 124
10  PhilovonFreisinn.debug.dylib  	       0x104960a80 __debug_main_executable_dylib_entry_point + 64 (AppDelegate.swift:6)
11  ???                           	       0x1029d5410 ???
12  dyld                          	       0x1028a8d54 start + 7184

Thread 1:: com.apple.uikit.eventfetch-thread
0   libsystem_kernel.dylib        	       0x102834b70 mach_msg2_trap + 8
1   libsystem_kernel.dylib        	       0x10284590c mach_msg2_internal + 72
2   libsystem_kernel.dylib        	       0x10283cc10 mach_msg_overwrite + 480
3   libsystem_kernel.dylib        	       0x102834ee4 mach_msg + 20
4   CoreFoundation                	       0x18041ab60 __CFRunLoopServiceMachPort + 156
5   CoreFoundation                	       0x180415224 __CFRunLoopRun + 1160
6   CoreFoundation                	       0x180414960 CFRunLoopRunSpecific + 536
7   Foundation                    	       0x180f2af24 -[NSRunLoop(NSRunLoop) runMode:beforeDate:] + 208
8   Foundation                    	       0x180f2b144 -[NSRunLoop(NSRunLoop) runUntilDate:] + 60
9   UIKitCore                     	       0x185b4ec88 -[UIEventFetcher threadMain] + 404
10  Foundation                    	       0x180f51d6c __NSThread__start__ + 720
11  libsystem_pthread.dylib       	       0x10266a5ac _pthread_start + 104
12  libsystem_pthread.dylib       	       0x102665998 thread_start + 8

Thread 2 Crashed:: com.facebook.react.runtime.JavaScript
0     React                         	       0x10a3b4794 long std::__1::__libcpp_atomic_refcount_decrement[abi:de180100]<long>(long&) + 32
1     React                         	       0x10a3b4718 std::__1::__shared_count::__release_shared[abi:de180100]() + 32
2     React                         	       0x10a3b46d8 std::__1::__shared_weak_count::__release_shared[abi:de180100]() + 28
-------- RECURSION 1, LEVEL 1556
3     React                         	       0x10a3bca94 std::__1::shared_ptr<void>::~shared_ptr[abi:de180100]() + 64
4     React                         	       0x10a3bca44 std::__1::shared_ptr<void>::~shared_ptr[abi:de180100]() + 28
5     React                         	       0x10a3bca18 facebook::react::Color::~Color() + 28
6     React                         	       0x10a3bc9ec facebook::react::Color::~Color() + 28
7     React                         	       0x10a3bc9c0 facebook::react::SharedColor::~SharedColor() + 28
8     React                         	       0x10a3b8994 facebook::react::SharedColor::~SharedColor() + 28
9     React                         	       0x10a432eb4 facebook::react::TextAttributes::~TextAttributes() + 84
10    React                         	       0x10a432e08 facebook::react::TextAttributes::~TextAttributes() + 28
11    React                         	       0x10a43417c facebook::react::AttributedString::~AttributedString() + 48
12    React                         	       0x10a4311b8 facebook::react::AttributedString::~AttributedString() + 28
13    React                         	       0x10a458fa4 facebook::react::TextInputState::~TextInputState() + 44
14    React                         	       0x10a4539b4 facebook::react::TextInputState::~TextInputState() + 28
15    React                         	       0x10a45f2cc void std::__1::__destroy_at[abi:de180100]<facebook::react::TextInputState const, 0>(facebook::react::TextInputState const*) + 52
16    React                         	       0x10a45f28c void std::__1::allocator_traits<std::__1::allocator<facebook::react::TextInputState const>>::destroy[abi:de180100]<facebook::react::TextInputState const, void, void>(std::__1::allocator<facebook::react::TextInputState const>&, facebook::react::TextInputState const*) + 28
17    React                         	       0x10a45f25c void std::__1::__shared_ptr_emplace<facebook::react::TextInputState const, std::__1::allocator<facebook::react::TextInputState const>>::__on_zero_shared_impl[abi:de180100]<std::__1::allocator<facebook::react::TextInputState const>, 0>() + 48
18    React                         	       0x10a45efb8 std::__1::__shared_ptr_emplace<facebook::react::TextInputState const, std::__1::allocator<facebook::react::TextInputState const>>::__on_zero_shared() + 24
19    React                         	       0x10a3b4738 std::__1::__shared_count::__release_shared[abi:de180100]() + 64
20    React                         	       0x10a3b46d8 std::__1::__shared_weak_count::__release_shared[abi:de180100]() + 28
-------- RECURSION 1, LEVEL 1555
21    React                         	       0x10a3bfcf4 std::__1::shared_ptr<void const>::~shared_ptr[abi:de180100]() + 64
22    React                         	       0x10a3bfc4c std::__1::shared_ptr<void const>::~shared_ptr[abi:de180100]() + 28
23    React                         	       0x10a3dcec0 facebook::react::State::~State() + 48
24    React                         	       0x10a45e720 facebook::react::ConcreteState<facebook::react::TextInputState>::~ConcreteState() + 28
25    React                         	       0x10a45e684 facebook::react::ConcreteState<facebook::react::TextInputState>::~ConcreteState() + 28
26    React                         	       0x10a45e84c void std::__1::__destroy_at[abi:de180100]<facebook::react::ConcreteState<facebook::react::TextInputState> const, 0>(facebook::react::ConcreteState<facebook::react::TextInputState> const*) + 60
27    React                         	       0x10a45e804 void std::__1::allocator_traits<std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>>::destroy[abi:de180100]<facebook::react::ConcreteState<facebook::react::TextInputState> const, void, void>(std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>&, facebook::react::ConcreteState<facebook::react::TextInputState> const*) + 28
28    React                         	       0x10a45e7d4 void std::__1::__shared_ptr_emplace<facebook::react::ConcreteState<facebook::react::TextInputState> const, std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>>::__on_zero_shared_impl[abi:de180100]<std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>, 0>() + 48
29    React                         	       0x10a45e344 std::__1::__shared_ptr_emplace<facebook::react::ConcreteState<facebook::react::TextInputState> const, std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>>::__on_zero_shared() + 24
30    React                         	       0x10a3b4738 std::__1::__shared_count::__release_shared[abi:de180100]() + 64
31    React                         	       0x10a3b46d8 std::__1::__shared_weak_count::__release_shared[abi:de180100]() + 28
-------- RECURSION 1, LEVEL 1554
--------
-------- ELIDED 1550 LEVELS OF RECURSION THROUGH 0x10a3b46d8 std::__1::__shared_weak_count::__release_shared[abi:de180100]() + 28
--------
26402 React                         	       0x10a3c1958 std::__1::shared_ptr<facebook::react::State const>::~shared_ptr[abi:de180100]() + 64
26403 React                         	       0x10a3c1808 std::__1::shared_ptr<facebook::react::State const>::~shared_ptr[abi:de180100]() + 28
26404 React                         	       0x10a432e38 facebook::react::ShadowView::~ShadowView() + 32
26405 React                         	       0x10a432ddc facebook::react::ShadowView::~ShadowView() + 28
26406 React                         	       0x10a432d9c facebook::react::AttributedString::Fragment::~Fragment() + 32
26407 React                         	       0x10a432d6c facebook::react::AttributedString::Fragment::~Fragment() + 28
26408 React                         	       0x10a432d44 void std::__1::__destroy_at[abi:de180100]<facebook::react::AttributedString::Fragment, 0>(facebook::react::AttributedString::Fragment*) + 52
26409 React                         	       0x10a432ca8 void std::__1::allocator_traits<std::__1::allocator<facebook::react::AttributedString::Fragment>>::destroy[abi:de180100]<facebook::react::AttributedString::Fragment, void, void>(std::__1::allocator<facebook::react::AttributedString::Fragment>&, facebook::react::AttributedString::Fragment*) + 28
26410 React                         	       0x10a433680 std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::__base_destruct_at_end[abi:de180100](facebook::react::AttributedString::Fragment*) + 104
26411 React                         	       0x10a433784 std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::__clear[abi:de180100]() + 28
26412 React                         	       0x10a434030 std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::__destroy_vector::operator()[abi:de180100]() + 60
26413 React                         	       0x10a4340b0 std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::~vector[abi:de180100]() + 44
26414 React                         	       0x10a433c50 std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::~vector[abi:de180100]() + 28
26415 React                         	       0x10a434188 facebook::react::AttributedString::~AttributedString() + 60
26416 React                         	       0x10a4311b8 facebook::react::AttributedString::~AttributedString() + 28
26417 React                         	       0x10a458fa4 facebook::react::TextInputState::~TextInputState() + 44
26418 React                         	       0x10a4539b4 facebook::react::TextInputState::~TextInputState() + 28
26419 React                         	       0x10a45f2cc void std::__1::__destroy_at[abi:de180100]<facebook::react::TextInputState const, 0>(facebook::react::TextInputState const*) + 52
26420 React                         	       0x10a45f28c void std::__1::allocator_traits<std::__1::allocator<facebook::react::TextInputState const>>::destroy[abi:de180100]<facebook::react::TextInputState const, void, void>(std::__1::allocator<facebook::react::TextInputState const>&, facebook::react::TextInputState const*) + 28
26421 React                         	       0x10a45f25c void std::__1::__shared_ptr_emplace<facebook::react::TextInputState const, std::__1::allocator<facebook::react::TextInputState const>>::__on_zero_shared_impl[abi:de180100]<std::__1::allocator<facebook::react::TextInputState const>, 0>() + 48
26422 React                         	       0x10a45efb8 std::__1::__shared_ptr_emplace<facebook::react::TextInputState const, std::__1::allocator<facebook::react::TextInputState const>>::__on_zero_shared() + 24
26423 React                         	       0x10a3b4738 std::__1::__shared_count::__release_shared[abi:de180100]() + 64
26424 React                         	       0x10a3b46d8 std::__1::__shared_weak_count::__release_shared[abi:de180100]() + 28
-------- RECURSION 1, LEVEL 3
26425 React                         	       0x10a3bfcf4 std::__1::shared_ptr<void const>::~shared_ptr[abi:de180100]() + 64
26426 React                         	       0x10a3bfc4c std::__1::shared_ptr<void const>::~shared_ptr[abi:de180100]() + 28
26427 React                         	       0x10a3dcec0 facebook::react::State::~State() + 48
26428 React                         	       0x10a45e720 facebook::react::ConcreteState<facebook::react::TextInputState>::~ConcreteState() + 28
26429 React                         	       0x10a45e684 facebook::react::ConcreteState<facebook::react::TextInputState>::~ConcreteState() + 28
26430 React                         	       0x10a45e84c void std::__1::__destroy_at[abi:de180100]<facebook::react::ConcreteState<facebook::react::TextInputState> const, 0>(facebook::react::ConcreteState<facebook::react::TextInputState> const*) + 60
26431 React                         	       0x10a45e804 void std::__1::allocator_traits<std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>>::destroy[abi:de180100]<facebook::react::ConcreteState<facebook::react::TextInputState> const, void, void>(std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>&, facebook::react::ConcreteState<facebook::react::TextInputState> const*) + 28
26432 React                         	       0x10a45e7d4 void std::__1::__shared_ptr_emplace<facebook::react::ConcreteState<facebook::react::TextInputState> const, std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>>::__on_zero_shared_impl[abi:de180100]<std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>, 0>() + 48
26433 React                         	       0x10a45e344 std::__1::__shared_ptr_emplace<facebook::react::ConcreteState<facebook::react::TextInputState> const, std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>>::__on_zero_shared() + 24
26434 React                         	       0x10a3b4738 std::__1::__shared_count::__release_shared[abi:de180100]() + 64
26435 React                         	       0x10a3b46d8 std::__1::__shared_weak_count::__release_shared[abi:de180100]() + 28
-------- RECURSION 1, LEVEL 2
26436 React                         	       0x10a3c1958 std::__1::shared_ptr<facebook::react::State const>::~shared_ptr[abi:de180100]() + 64
26437 React                         	       0x10a3c1808 std::__1::shared_ptr<facebook::react::State const>::~shared_ptr[abi:de180100]() + 28
26438 React                         	       0x10a432e38 facebook::react::ShadowView::~ShadowView() + 32
26439 React                         	       0x10a432ddc facebook::react::ShadowView::~ShadowView() + 28
26440 React                         	       0x10a432d9c facebook::react::AttributedString::Fragment::~Fragment() + 32
26441 React                         	       0x10a432d6c facebook::react::AttributedString::Fragment::~Fragment() + 28
26442 React                         	       0x10a432d44 void std::__1::__destroy_at[abi:de180100]<facebook::react::AttributedString::Fragment, 0>(facebook::react::AttributedString::Fragment*) + 52
26443 React                         	       0x10a432ca8 void std::__1::allocator_traits<std::__1::allocator<facebook::react::AttributedString::Fragment>>::destroy[abi:de180100]<facebook::react::AttributedString::Fragment, void, void>(std::__1::allocator<facebook::react::AttributedString::Fragment>&, facebook::react::AttributedString::Fragment*) + 28
26444 React                         	       0x10a433680 std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::__base_destruct_at_end[abi:de180100](facebook::react::AttributedString::Fragment*) + 104
26445 React                         	       0x10a433784 std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::__clear[abi:de180100]() + 28
26446 React                         	       0x10a434030 std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::__destroy_vector::operator()[abi:de180100]() + 60
26447 React                         	       0x10a4340b0 std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::~vector[abi:de180100]() + 44
26448 React                         	       0x10a433c50 std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::~vector[abi:de180100]() + 28
26449 React                         	       0x10a434188 facebook::react::AttributedString::~AttributedString() + 60
26450 React                         	       0x10a4311b8 facebook::react::AttributedString::~AttributedString() + 28
26451 React                         	       0x10a458fa4 facebook::react::TextInputState::~TextInputState() + 44
26452 React                         	       0x10a4539b4 facebook::react::TextInputState::~TextInputState() + 28
26453 React                         	       0x10a45f2cc void std::__1::__destroy_at[abi:de180100]<facebook::react::TextInputState const, 0>(facebook::react::TextInputState const*) + 52
26454 React                         	       0x10a45f28c void std::__1::allocator_traits<std::__1::allocator<facebook::react::TextInputState const>>::destroy[abi:de180100]<facebook::react::TextInputState const, void, void>(std::__1::allocator<facebook::react::TextInputState const>&, facebook::react::TextInputState const*) + 28
26455 React                         	       0x10a45f25c void std::__1::__shared_ptr_emplace<facebook::react::TextInputState const, std::__1::allocator<facebook::react::TextInputState const>>::__on_zero_shared_impl[abi:de180100]<std::__1::allocator<facebook::react::TextInputState const>, 0>() + 48
26456 React                         	       0x10a45efb8 std::__1::__shared_ptr_emplace<facebook::react::TextInputState const, std::__1::allocator<facebook::react::TextInputState const>>::__on_zero_shared() + 24
26457 React                         	       0x10a3b4738 std::__1::__shared_count::__release_shared[abi:de180100]() + 64
26458 React                         	       0x10a3b46d8 std::__1::__shared_weak_count::__release_shared[abi:de180100]() + 28
-------- RECURSION 1, LEVEL 1
26459 React                         	       0x10a3bfcf4 std::__1::shared_ptr<void const>::~shared_ptr[abi:de180100]() + 64
26460 React                         	       0x10a3bfc4c std::__1::shared_ptr<void const>::~shared_ptr[abi:de180100]() + 28
26461 React                         	       0x10a3dcec0 facebook::react::State::~State() + 48
26462 React                         	       0x10a45e720 facebook::react::ConcreteState<facebook::react::TextInputState>::~ConcreteState() + 28
26463 React                         	       0x10a45e684 facebook::react::ConcreteState<facebook::react::TextInputState>::~ConcreteState() + 28
26464 React                         	       0x10a45e84c void std::__1::__destroy_at[abi:de180100]<facebook::react::ConcreteState<facebook::react::TextInputState> const, 0>(facebook::react::ConcreteState<facebook::react::TextInputState> const*) + 60
26465 React                         	       0x10a45e804 void std::__1::allocator_traits<std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>>::destroy[abi:de180100]<facebook::react::ConcreteState<facebook::react::TextInputState> const, void, void>(std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>&, facebook::react::ConcreteState<facebook::react::TextInputState> const*) + 28
26466 React                         	       0x10a45e7d4 void std::__1::__shared_ptr_emplace<facebook::react::ConcreteState<facebook::react::TextInputState> const, std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>>::__on_zero_shared_impl[abi:de180100]<std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>, 0>() + 48
26467 React                         	       0x10a45e344 std::__1::__shared_ptr_emplace<facebook::react::ConcreteState<facebook::react::TextInputState> const, std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>>::__on_zero_shared() + 24
26468 React                         	       0x10a50e420 std::__1::__shared_count::__release_shared[abi:de180100]() + 64
26469 React                         	       0x10a50e3c0 std::__1::__shared_weak_count::__release_shared[abi:de180100]() + 28
26470 React                         	       0x10a50f6b0 std::__1::shared_ptr<facebook::react::State const>::~shared_ptr[abi:de180100]() + 64
26471 React                         	       0x10a50f54c std::__1::shared_ptr<facebook::react::State const>::~shared_ptr[abi:de180100]() + 28
26472 React                         	       0x10a5306c0 facebook::react::ShadowView::~ShadowView() + 32
26473 React                         	       0x10a52fc50 facebook::react::ShadowView::~ShadowView() + 28
26474 React                         	       0x10a530708 facebook::react::AttributedString::Fragment::~Fragment() + 32
26475 React                         	       0x10a52fc7c facebook::react::AttributedString::Fragment::~Fragment() + 28
26476 React                         	       0x10a546b44 void std::__1::__destroy_at[abi:de180100]<facebook::react::AttributedString::Fragment, 0>(facebook::react::AttributedString::Fragment*) + 52
26477 React                         	       0x10a546af0 void std::__1::allocator_traits<std::__1::allocator<facebook::react::AttributedString::Fragment>>::destroy[abi:de180100]<facebook::react::AttributedString::Fragment, void, void>(std::__1::allocator<facebook::react::AttributedString::Fragment>&, facebook::react::AttributedString::Fragment*) + 28
26478 React                         	       0x10a546ab0 std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::__base_destruct_at_end[abi:de180100](facebook::react::AttributedString::Fragment*) + 104
26479 React                         	       0x10a546990 std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::__clear[abi:de180100]() + 28
26480 React                         	       0x10a546900 std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::__destroy_vector::operator()[abi:de180100]() + 60
26481 React                         	       0x10a546878 std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::~vector[abi:de180100]() + 44
26482 React                         	       0x10a5466ec std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::~vector[abi:de180100]() + 28
26483 React                         	       0x10a548ecc facebook::react::AttributedString::~AttributedString() + 60
26484 React                         	       0x10a5442cc facebook::react::AttributedString::~AttributedString() + 28
26485 React                         	       0x10a58c3d0 facebook::react::TextMeasureCacheKey::~TextMeasureCacheKey() + 40
26486 React                         	       0x10a58a1c0 facebook::react::TextMeasureCacheKey::~TextMeasureCacheKey() + 28
26487 React                         	       0x10a58c0fc std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>::~pair() + 40
26488 React                         	       0x10a58c0c4 std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>::~pair() + 28
26489 React                         	       0x10a58c09c void std::__1::__destroy_at[abi:de180100]<std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>, 0>(std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>*) + 52
26490 React                         	       0x10a58bf98 void std::__1::allocator_traits<std::__1::allocator<std::__1::__list_node<std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>, void*>>>::destroy[abi:de180100]<std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>, void, void>(std::__1::allocator<std::__1::__list_node<std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>, void*>>&, std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>*) + 28
26491 React                         	       0x10a58be74 void std::__1::__list_imp<std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>, std::__1::allocator<std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>>>::__delete_node[abi:de180100]<>(std::__1::__list_node<std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>, void*>*) + 60
26492 React                         	       0x10a58db18 std::__1::list<std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>, std::__1::allocator<std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>>>::pop_back() + 108
26493 React                         	       0x10a58a0e0 facebook::react::TextMeasurement facebook::react::SimpleThreadSafeCache<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement, 1024>::get<facebook::react::TextLayoutManager::measure(facebook::react::AttributedStringBox const&, facebook::react::ParagraphAttributes const&, facebook::react::TextLayoutContext const&, facebook::react::LayoutConstraints const&) const::$_0>(facebook::react::TextMeasureCacheKey const&, facebook::react::TextLayoutManager::measure(facebook::react::AttributedStringBox const&, facebook::react::ParagraphAttributes const&, facebook::react::TextLayoutContext const&, facebook::react::LayoutConstraints const&) const::$_0) const + 536
26494 React                         	       0x10a589ac8 facebook::react::TextLayoutManager::measure(facebook::react::AttributedStringBox const&, facebook::react::ParagraphAttributes const&, facebook::react::TextLayoutContext const&, facebook::react::LayoutConstraints const&) const + 344
26495 React                         	       0x10a45c220 facebook::react::BaseTextInputShadowNode<&facebook::react::TextInputComponentName, facebook::react::TextInputProps, facebook::react::TextInputEventEmitter, facebook::react::TextInputState>::measureContent(facebook::react::LayoutContext const&, facebook::react::LayoutConstraints const&) const + 196
26496 React                         	       0x10a222bcc facebook::react::YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector(YGNode const*, float, YGMeasureMode, float, YGMeasureMode) + 464
26497 React                         	       0x109cf3f68 facebook::yoga::Node::measure(float, facebook::yoga::MeasureMode, float, facebook::yoga::MeasureMode) + 112
26498 React                         	       0x109ce9938 facebook::yoga::measureNodeWithMeasureFunc(facebook::yoga::Node*, facebook::yoga::Direction, float, float, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, facebook::yoga::LayoutData&, facebook::yoga::LayoutPassReason) + 756
26499 React                         	       0x109ce67bc facebook::yoga::calculateLayoutImpl(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int) + 1060
26500 React                         	       0x109ce6054 facebook::yoga::calculateLayoutInternal(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int) + 1560
-------- RECURSION 2, LEVEL 25
26501 React                         	       0x109cec22c facebook::yoga::computeFlexBasisForChild(facebook::yoga::Node const*, facebook::yoga::Node*, float, facebook::yoga::SizingMode, float, float, float, facebook::yoga::SizingMode, facebook::yoga::Direction, facebook::yoga::LayoutData&, unsigned int, unsigned int) + 2200
26502 React                         	       0x109cea6c8 facebook::yoga::computeFlexBasisForChildren(facebook::yoga::Node*, float, float, facebook::yoga::SizingMode, facebook::yoga::SizingMode, facebook::yoga::Direction, facebook::yoga::FlexDirection, bool, facebook::yoga::LayoutData&, unsigned int, unsigned int) + 1072
26503 React                         	       0x109ce6b4c facebook::yoga::calculateLayoutImpl(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int) + 1972
26504 React                         	       0x109ce6054 facebook::yoga::calculateLayoutInternal(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int) + 1560
-------- RECURSION 2, LEVEL 24
26505 React                         	       0x109cec22c facebook::yoga::computeFlexBasisForChild(facebook::yoga::Node const*, facebook::yoga::Node*, float, facebook::yoga::SizingMode, float, float, float, facebook::yoga::SizingMode, facebook::yoga::Direction, facebook::yoga::LayoutData&, unsigned int, unsigned int) + 2200
26506 React                         	       0x109cea6c8 facebook::yoga::computeFlexBasisForChildren(facebook::yoga::Node*, float, float, facebook::yoga::SizingMode, facebook::yoga::SizingMode, facebook::yoga::Direction, facebook::yoga::FlexDirection, bool, facebook::yoga::LayoutData&, unsigned int, unsigned int) + 1072
26507 React                         	       0x109ce6b4c facebook::yoga::calculateLayoutImpl(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int) + 1972
26508 React                         	       0x109ce6054 facebook::yoga::calculateLayoutInternal(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int) + 1560
-------- RECURSION 2, LEVEL 23
--------
-------- ELIDED 19 LEVELS OF RECURSION THROUGH 0x109ce6054 facebook::yoga::calculateLayoutInternal(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int) + 1560
--------
26559 React                         	       0x109ce775c facebook::yoga::calculateLayoutImpl(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int) + 5060
26560 React                         	       0x109ce6054 facebook::yoga::calculateLayoutInternal(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int) + 1560
-------- RECURSION 2, LEVEL 3
26561 React                         	       0x109ce775c facebook::yoga::calculateLayoutImpl(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int) + 5060
26562 React                         	       0x109ce6054 facebook::yoga::calculateLayoutInternal(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int) + 1560
-------- RECURSION 2, LEVEL 2
26563 React                         	       0x109ce775c facebook::yoga::calculateLayoutImpl(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int) + 5060
26564 React                         	       0x109ce6054 facebook::yoga::calculateLayoutInternal(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int) + 1560
-------- RECURSION 2, LEVEL 1
26565 React                         	       0x109ce9498 facebook::yoga::calculateLayout(facebook::yoga::Node*, float, float, facebook::yoga::Direction) + 896
26566 React                         	       0x109cce0a0 YGNodeCalculateLayout + 88
26567 React                         	       0x10a227d94 facebook::react::YogaLayoutableShadowNode::layoutTree(facebook::react::LayoutContext, facebook::react::LayoutConstraints) + 2792
26568 React                         	       0x10a140218 facebook::react::RootShadowNode::layoutIfNeeded(std::__1::vector<facebook::react::LayoutableShadowNode const*, std::__1::allocator<facebook::react::LayoutableShadowNode const*>>*) + 268
26569 React                         	       0x10a2aecac facebook::react::ShadowTree::tryCommit(std::__1::function<std::__1::shared_ptr<facebook::react::RootShadowNode> (facebook::react::RootShadowNode const&)> const&, facebook::react::ShadowTreeCommitOptions const&) const + 724
26570 React                         	       0x10a2ae8c8 facebook::react::ShadowTree::commit(std::__1::function<std::__1::shared_ptr<facebook::react::RootShadowNode> (facebook::react::RootShadowNode const&)> const&, facebook::react::ShadowTreeCommitOptions const&) const + 256
26571 React                         	       0x10a340bbc facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)::$_0::operator()(facebook::react::ShadowTree const&) const + 108
26572 React                         	       0x10a340b44 decltype(std::declval<facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)::$_0&>()(std::declval<facebook::react::ShadowTree const&>())) std::__1::__invoke[abi:de180100]<facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)::$_0&, facebook::react::ShadowTree const&>(facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)::$_0&, facebook::react::ShadowTree const&) + 32
26573 React                         	       0x10a340af4 void std::__1::__invoke_void_return_wrapper<void, true>::__call[abi:de180100]<facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)::$_0&, facebook::react::ShadowTree const&>(facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)::$_0&, facebook::react::ShadowTree const&) + 32
26574 React                         	       0x10a340ac8 std::__1::__function::__alloc_func<facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)::$_0, std::__1::allocator<facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)::$_0>, void (facebook::react::ShadowTree const&)>::operator()[abi:de180100](facebook::react::ShadowTree const&) + 36
26575 React                         	       0x10a33fac8 std::__1::__function::__func<facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)::$_0, std::__1::allocator<facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)::$_0>, void (facebook::react::ShadowTree const&)>::operator()(facebook::react::ShadowTree const&) + 36
26576 React                         	       0x10a2bc9b0 std::__1::__function::__value_func<void (facebook::react::ShadowTree const&)>::operator()[abi:de180100](facebook::react::ShadowTree const&) const + 76
26577 React                         	       0x10a2b9bac std::__1::function<void (facebook::react::ShadowTree const&)>::operator()(facebook::react::ShadowTree const&) const + 32
26578 React                         	       0x10a2b9b4c facebook::react::ShadowTreeRegistry::visit(int, std::__1::function<void (facebook::react::ShadowTree const&)> const&) const + 248
26579 React                         	       0x10a334ee4 facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions) + 168
26580 React                         	       0x10a37d06c facebook::react::UIManagerBinding::get(facebook::jsi::Runtime&, facebook::jsi::PropNameID const&)::$_9::operator()(facebook::jsi::Runtime&, facebook::jsi::Value const&, facebook::jsi::Value const*, unsigned long) const + 176
26581 React                         	       0x10a37cfb0 decltype(std::declval<facebook::react::UIManagerBinding::get(facebook::jsi::Runtime&, facebook::jsi::PropNameID const&)::$_9&>()(std::declval<facebook::jsi::Runtime&>(), std::declval<facebook::jsi::Value const&>(), std::declval<facebook::jsi::Value const*>(), std::declval<unsigned long>())) std::__1::__invoke[abi:de180100]<facebook::react::UIManagerBinding::get(facebook::jsi::Runtime&, facebook::jsi::PropNameID const&)::$_9&, facebook::jsi::Runtime&, facebook::jsi::Value const&, facebook::jsi::Value const*, unsigned long>(facebook::react::UIManagerBinding::get(facebook::jsi::Runtime&, facebook::jsi::PropNameID const&)::$_9&, facebook::jsi::Runtime&, facebook::jsi::Value const&, facebook::jsi::Value const*&&, unsigned long&&) + 72
26582 React                         	       0x10a37cf38 facebook::jsi::Value std::__1::__invoke_void_return_wrapper<facebook::jsi::Value, false>::__call[abi:de180100]<facebook::react::UIManagerBinding::get(facebook::jsi::Runtime&, facebook::jsi::PropNameID const&)::$_9&, facebook::jsi::Runtime&, facebook::jsi::Value const&, facebook::jsi::Value const*, unsigned long>(facebook::react::UIManagerBinding::get(facebook::jsi::Runtime&, facebook::jsi::PropNameID const&)::$_9&, facebook::jsi::Runtime&, facebook::jsi::Value const&, facebook::jsi::Value const*&&, unsigned long&&) + 64
26583 React                         	       0x10a37ceec std::__1::__function::__alloc_func<facebook::react::UIManagerBinding::get(facebook::jsi::Runtime&, facebook::jsi::PropNameID const&)::$_9, std::__1::allocator<facebook::react::UIManagerBinding::get(facebook::jsi::Runtime&, facebook::jsi::PropNameID const&)::$_9>, facebook::jsi::Value (facebook::jsi::Runtime&, facebook::jsi::Value const&, facebook::jsi::Value const*, unsigned long)>::operator()[abi:de180100](facebook::jsi::Runtime&, facebook::jsi::Value const&, facebook::jsi::Value const*&&, unsigned long&&) + 72
26584 React                         	       0x10a37bc6c std::__1::__function::__func<facebook::react::UIManagerBinding::get(facebook::jsi::Runtime&, facebook::jsi::PropNameID const&)::$_9, std::__1::allocator<facebook::react::UIManagerBinding::get(facebook::jsi::Runtime&, facebook::jsi::PropNameID const&)::$_9>, facebook::jsi::Value (facebook::jsi::Runtime&, facebook::jsi::Value const&, facebook::jsi::Value const*, unsigned long)>::operator()(facebook::jsi::Runtime&, facebook::jsi::Value const&, facebook::jsi::Value const*&&, unsigned long&&) + 68
26585 hermes                        	       0x103860b20 facebook::hermes::(anonymous namespace)::HermesRuntimeImpl::HFContext::func(void*, hermes::vm::Runtime&, hermes::vm::NativeArgs) + 532
26586 hermes                        	       0x10391bb58 hermes::vm::NativeFunction::_nativeCall(hermes::vm::NativeFunction*, hermes::vm::Runtime&) + 144
26587 hermes                        	       0x103935de4 hermes::vm::CallResult<hermes::vm::HermesValue, (hermes::vm::detail::CallResultSpecialize)2> hermes::vm::Interpreter::interpretFunction<false, false>(hermes::vm::Runtime&, hermes::vm::InterpreterState&) + 2320
26588 hermes                        	       0x1039354a0 hermes::vm::Runtime::interpretFunctionImpl(hermes::vm::CodeBlock*) + 132
26589 hermes                        	       0x10391be2c hermes::vm::JSFunction::_callImpl(hermes::vm::Handle<hermes::vm::Callable>, hermes::vm::Runtime&) + 40
26590 hermes                        	       0x10391b63c hermes::vm::BoundFunction::_boundCall(hermes::vm::BoundFunction*, hermes::inst::Inst const*, hermes::vm::Runtime&) + 504
26591 hermes                        	       0x103857398 facebook::hermes::(anonymous namespace)::HermesRuntimeImpl::call(facebook::jsi::Function const&, facebook::jsi::Value const&, facebook::jsi::Value const*, unsigned long) + 748
26592 React                         	       0x10a5fbdd4 facebook::jsi::Function::call(facebook::jsi::Runtime&, facebook::jsi::Value const*, unsigned long) const + 100
26593 React                         	       0x10a5fbd24 facebook::jsi::Function::call(facebook::jsi::Runtime&, std::initializer_list<facebook::jsi::Value>) const + 112
26594 React                         	       0x10a6322f8 facebook::react::Task::execute(facebook::jsi::Runtime&, bool) + 292
26595 React                         	       0x10a6275fc facebook::react::RuntimeScheduler_Modern::executeTask(facebook::jsi::Runtime&, facebook::react::Task&, bool) const + 160
26596 React                         	       0x10a628144 facebook::react::RuntimeScheduler_Modern::runEventLoopTick(facebook::jsi::Runtime&, facebook::react::Task&) + 244
26597 React                         	       0x10a627e74 facebook::react::RuntimeScheduler_Modern::runEventLoop(facebook::jsi::Runtime&) + 168
26598 React                         	       0x10a6314e0 facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0::operator()(facebook::jsi::Runtime&) const + 36
26599 React                         	       0x10a6314b0 decltype(std::declval<facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0&>()(std::declval<facebook::jsi::Runtime&>())) std::__1::__invoke[abi:de180100]<facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0&, facebook::jsi::Runtime&>(facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0&, facebook::jsi::Runtime&) + 32
26600 React                         	       0x10a631460 void std::__1::__invoke_void_return_wrapper<void, true>::__call[abi:de180100]<facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0&, facebook::jsi::Runtime&>(facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0&, facebook::jsi::Runtime&) + 32
26601 React                         	       0x10a631434 std::__1::__function::__alloc_func<facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0, std::__1::allocator<facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0>, void (facebook::jsi::Runtime&)>::operator()[abi:de180100](facebook::jsi::Runtime&) + 36
26602 React                         	       0x10a6302c0 std::__1::__function::__func<facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0, std::__1::allocator<facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0>, void (facebook::jsi::Runtime&)>::operator()(facebook::jsi::Runtime&) + 36
26603 React                         	       0x10a6b9c90 std::__1::__function::__value_func<void (facebook::jsi::Runtime&)>::operator()[abi:de180100](facebook::jsi::Runtime&) const + 76
26604 React                         	       0x10a6b7df8 std::__1::function<void (facebook::jsi::Runtime&)>::operator()(facebook::jsi::Runtime&) const + 32
26605 React                         	       0x10a6b7a78 _ZZZN8facebook5react13ReactInstanceC1ENSt3__110unique_ptrINS0_9JSRuntimeENS2_14default_deleteIS4_EEEENS2_10shared_ptrINS0_18MessageQueueThreadEEENS8_INS0_12TimerManagerEEENS2_8functionIFvRNS_3jsi7RuntimeERKNS0_14JsErrorHandler14ProcessedErrorEEEEPNS0_18jsinspector_modern10HostTargetEENK3$_0clINSD_IFvSG_EEEEEDaT_ENKUlvE_clEv + 148
26606 React                         	       0x10a6b79d8 _ZNSt3__18__invokeB8de180100IRZZN8facebook5react13ReactInstanceC1ENS_10unique_ptrINS2_9JSRuntimeENS_14default_deleteIS5_EEEENS_10shared_ptrINS2_18MessageQueueThreadEEENS9_INS2_12TimerManagerEEENS_8functionIFvRNS1_3jsi7RuntimeERKNS2_14JsErrorHandler14ProcessedErrorEEEEPNS2_18jsinspector_modern10HostTargetEENK3$_0clINSE_IFvSH_EEEEEDaT_EUlvE_JEEEDTclclsr3stdE7declvalISW_EEspclsr3stdE7declvalIT0_EEEEOSW_DpOSZ_ + 24
26607 React                         	       0x10a6b7990 _ZNSt3__128__invoke_void_return_wrapperIvLb1EE6__callB8de180100IJRZZN8facebook5react13ReactInstanceC1ENS_10unique_ptrINS4_9JSRuntimeENS_14default_deleteIS7_EEEENS_10shared_ptrINS4_18MessageQueueThreadEEENSB_INS4_12TimerManagerEEENS_8functionIFvRNS3_3jsi7RuntimeERKNS4_14JsErrorHandler14ProcessedErrorEEEEPNS4_18jsinspector_modern10HostTargetEENK3$_0clINSG_IFvSJ_EEEEEDaT_EUlvE_EEEvDpOT_ + 24
26608 React                         	       0x10a6b796c _ZNSt3__110__function12__alloc_funcIZZN8facebook5react13ReactInstanceC1ENS_10unique_ptrINS3_9JSRuntimeENS_14default_deleteIS6_EEEENS_10shared_ptrINS3_18MessageQueueThreadEEENSA_INS3_12TimerManagerEEENS_8functionIFvRNS2_3jsi7RuntimeERKNS3_14JsErrorHandler14ProcessedErrorEEEEPNS3_18jsinspector_modern10HostTargetEENK3$_0clINSF_IFvSI_EEEEEDaT_EUlvE_NS_9allocatorISY_EEFvvEEclB8de180100Ev + 28
26609 React                         	       0x10a6b66a4 _ZNSt3__110__function6__funcIZZN8facebook5react13ReactInstanceC1ENS_10unique_ptrINS3_9JSRuntimeENS_14default_deleteIS6_EEEENS_10shared_ptrINS3_18MessageQueueThreadEEENSA_INS3_12TimerManagerEEENS_8functionIFvRNS2_3jsi7RuntimeERKNS3_14JsErrorHandler14ProcessedErrorEEEEPNS3_18jsinspector_modern10HostTargetEENK3$_0clINSF_IFvSI_EEEEEDaT_EUlvE_NS_9allocatorISY_EEFvvEEclEv + 28
26610 React                         	       0x109eddee8 std::__1::__function::__value_func<void ()>::operator()[abi:de180100]() const + 68
26611 React                         	       0x109edde08 std::__1::function<void ()>::operator()() const + 24
26612 React                         	       0x109f7092c facebook::react::tryAndReturnError(std::__1::function<void ()> const&) + 24
26613 React                         	       0x109f59140 facebook::react::RCTMessageThread::tryFunc(std::__1::function<void ()> const&) + 36
26614 React                         	       0x109f5dea8 facebook::react::RCTMessageThread::runOnQueue(std::__1::function<void ()>&&)::$_0::operator()() const + 80
26615 React                         	       0x109f5de4c decltype(std::declval<facebook::react::RCTMessageThread::runOnQueue(std::__1::function<void ()>&&)::$_0&>()()) std::__1::__invoke[abi:de180100]<facebook::react::RCTMessageThread::runOnQueue(std::__1::function<void ()>&&)::$_0&>(facebook::react::RCTMessageThread::runOnQueue(std::__1::function<void ()>&&)::$_0&) + 24
26616 React                         	       0x109f5de04 void std::__1::__invoke_void_return_wrapper<void, true>::__call[abi:de180100]<facebook::react::RCTMessageThread::runOnQueue(std::__1::function<void ()>&&)::$_0&>(facebook::react::RCTMessageThread::runOnQueue(std::__1::function<void ()>&&)::$_0&) + 24
26617 React                         	       0x109f5dde0 std::__1::__function::__alloc_func<facebook::react::RCTMessageThread::runOnQueue(std::__1::function<void ()>&&)::$_0, std::__1::allocator<facebook::react::RCTMessageThread::runOnQueue(std::__1::function<void ()>&&)::$_0>, void ()>::operator()[abi:de180100]() + 28
26618 React                         	       0x109f5cb00 std::__1::__function::__func<facebook::react::RCTMessageThread::runOnQueue(std::__1::function<void ()>&&)::$_0, std::__1::allocator<facebook::react::RCTMessageThread::runOnQueue(std::__1::function<void ()>&&)::$_0>, void ()>::operator()() + 28
26619 React                         	       0x109eddee8 std::__1::__function::__value_func<void ()>::operator()[abi:de180100]() const + 68
26620 React                         	       0x109edde08 std::__1::function<void ()>::operator()() const + 24
26621 React                         	       0x109f58ed8 invocation function for block in facebook::react::RCTMessageThread::runAsync(std::__1::function<void ()>) + 48
26622 CoreFoundation                	       0x18041b0ec __CFRUNLOOP_IS_CALLING_OUT_TO_A_BLOCK__ + 20
26623 CoreFoundation                	       0x18041a824 __CFRunLoopDoBlocks + 352
26624 CoreFoundation                	       0x1804156d8 __CFRunLoopRun + 2364
26625 CoreFoundation                	       0x180414960 CFRunLoopRunSpecific + 536
26626 React                         	       0x10a74c508 +[RCTJSThreadManager runRunLoop] + 292
26627 Foundation                    	       0x180f51d6c __NSThread__start__ + 720
26628 libsystem_pthread.dylib       	       0x10266a5ac _pthread_start + 104
26629 libsystem_pthread.dylib       	       0x102665998 thread_start + 8

Thread 3:: hades
0   libsystem_kernel.dylib        	       0x102838020 __psynch_cvwait + 8
1   libsystem_pthread.dylib       	       0x10266aa74 _pthread_cond_wait + 976
2   libc++.1.dylib                	       0x18030329c std::__1::condition_variable::wait(std::__1::unique_lock<std::__1::mutex>&) + 24
3   hermes                        	       0x1039ff0dc hermes::vm::HadesGC::Executor::worker() + 112
4   hermes                        	       0x1039ff040 void* std::__1::__thread_proxy[abi:nn180100]<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct>>, hermes::vm::HadesGC::Executor::Executor()::'lambda'()>>(void*) + 44
5   libsystem_pthread.dylib       	       0x10266a5ac _pthread_start + 104
6   libsystem_pthread.dylib       	       0x102665998 thread_start + 8

Thread 4:: com.apple.CFStream.LegacyThread
0   libsystem_kernel.dylib        	       0x102834b70 mach_msg2_trap + 8
1   libsystem_kernel.dylib        	       0x10284590c mach_msg2_internal + 72
2   libsystem_kernel.dylib        	       0x10283cc10 mach_msg_overwrite + 480
3   libsystem_kernel.dylib        	       0x102834ee4 mach_msg + 20
4   CoreFoundation                	       0x18041ab60 __CFRunLoopServiceMachPort + 156
5   CoreFoundation                	       0x180415224 __CFRunLoopRun + 1160
6   CoreFoundation                	       0x180414960 CFRunLoopRunSpecific + 536
7   CoreFoundation                	       0x180438f28 _legacyStreamRunLoop_workThread + 260
8   libsystem_pthread.dylib       	       0x10266a5ac _pthread_start + 104
9   libsystem_pthread.dylib       	       0x102665998 thread_start + 8

Thread 5:: com.facebook.SocketRocket.NetworkThread
0   libsystem_kernel.dylib        	       0x102834b70 mach_msg2_trap + 8
1   libsystem_kernel.dylib        	       0x10284590c mach_msg2_internal + 72
2   libsystem_kernel.dylib        	       0x10283cc10 mach_msg_overwrite + 480
3   libsystem_kernel.dylib        	       0x102834ee4 mach_msg + 20
4   CoreFoundation                	       0x18041ab60 __CFRunLoopServiceMachPort + 156
5   CoreFoundation                	       0x180415224 __CFRunLoopRun + 1160
6   CoreFoundation                	       0x180414960 CFRunLoopRunSpecific + 536
7   Foundation                    	       0x180f2af24 -[NSRunLoop(NSRunLoop) runMode:beforeDate:] + 208
8   ReactNativeDependencies       	       0x102e85c10 -[SRRunLoopThread main] + 260
9   Foundation                    	       0x180f51d6c __NSThread__start__ + 720
10  libsystem_pthread.dylib       	       0x10266a5ac _pthread_start + 104
11  libsystem_pthread.dylib       	       0x102665998 thread_start + 8

Thread 6:: com.apple.NSURLConnectionLoader
0   libsystem_kernel.dylib        	       0x102834b70 mach_msg2_trap + 8
1   libsystem_kernel.dylib        	       0x10284590c mach_msg2_internal + 72
2   libsystem_kernel.dylib        	       0x10283cc10 mach_msg_overwrite + 480
3   libsystem_kernel.dylib        	       0x102834ee4 mach_msg + 20
4   CoreFoundation                	       0x18041ab60 __CFRunLoopServiceMachPort + 156
5   CoreFoundation                	       0x180415224 __CFRunLoopRun + 1160
6   CoreFoundation                	       0x180414960 CFRunLoopRunSpecific + 536
7   CFNetwork                     	       0x1849b9510 +[__CFN_CoreSchedulingSetRunnable _run:] + 372
8   Foundation                    	       0x180f51d6c __NSThread__start__ + 720
9   libsystem_pthread.dylib       	       0x10266a5ac _pthread_start + 104
10  libsystem_pthread.dylib       	       0x102665998 thread_start + 8

Thread 7:: com.apple.CFSocket.private
0   libsystem_kernel.dylib        	       0x10283ef80 __select + 8
1   CoreFoundation                	       0x1804295a4 __CFSocketManager + 676
2   libsystem_pthread.dylib       	       0x10266a5ac _pthread_start + 104
3   libsystem_pthread.dylib       	       0x102665998 thread_start + 8

Thread 8:: hades
0   libsystem_kernel.dylib        	       0x102838020 __psynch_cvwait + 8
1   libsystem_pthread.dylib       	       0x10266aa74 _pthread_cond_wait + 976
2   libc++.1.dylib                	       0x18030329c std::__1::condition_variable::wait(std::__1::unique_lock<std::__1::mutex>&) + 24
3   hermes                        	       0x1039ff0dc hermes::vm::HadesGC::Executor::worker() + 112
4   hermes                        	       0x1039ff040 void* std::__1::__thread_proxy[abi:nn180100]<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct>>, hermes::vm::HadesGC::Executor::Executor()::'lambda'()>>(void*) + 44
5   libsystem_pthread.dylib       	       0x10266a5ac _pthread_start + 104
6   libsystem_pthread.dylib       	       0x102665998 thread_start + 8

Thread 9:

Thread 10:

Thread 11:

Thread 12:

Thread 13:


Thread 2 crashed with ARM Thread State (64-bit):
    x0: 0x0000600000d44ed8   x1: 0x00000003085c9278   x2: 0x0000000000006503   x3: 0x0000000000000038
    x4: 0x000000016953be30   x5: 0x0000000000000025   x6: 0x0000000000000000   x7: 0x00000003231cd410
    x8: 0x000000000000570f   x9: 0xffffffffffffffff  x10: 0x0000000000179f41  x11: 0x00000000000e48b0
   x12: 0x0000000000000000  x13: 0x000000010277e9d8  x14: 0x0000000000000000  x15: 0x0000000000000000
   x16: 0x00000001802fb44c  x17: 0x000000016953c08d  x18: 0x0000000000000000  x19: 0x0000000000000002
   x20: 0x000060000370d5c0  x21: 0x0000600000cb41b0  x22: 0x000000016e3a8ee0  x23: 0x000000016e3a8de8
   x24: 0x000000016e3a8de8  x25: 0x0000000106c00bf8  x26: 0x0007000000000000  x27: 0xfff8ffffffffffff
   x28: 0x0000000000000002   fp: 0x000000016e2a8030   lr: 0x000000010a3b4718
    sp: 0x000000016e2a7ff0   pc: 0x000000010a3b4794 cpsr: 0x20001000
   far: 0x000000016e2a7ff8  esr: 0x92000047 (Data Abort) byte write Translation fault

Binary Images:
       0x1028a0000 -        0x10293ffff dyld (*) <bc4db5f4-1c64-3706-8006-73b78c3e1f1a> /usr/lib/dyld
       0x10264c000 -        0x10264ffff berlin.cypherpunkacademy.ragapp (1.0.0) <da21dc10-e669-35ed-82f6-f025f770edb3> /Users/USER/Library/Developer/CoreSimulator/Devices/0142B3C6-1A4A-4584-8A98-C792E87DFCDD/data/Containers/Bundle/Application/F5EBD18C-E7CE-464C-BC35-BBDD2B698C97/PhilovonFreisinn.app/PhilovonFreisinn
       0x10495c000 -        0x1053e3fff PhilovonFreisinn.debug.dylib (*) <af61534c-2ace-389f-9ed2-ca2862da7f22> /Users/USER/Library/Developer/CoreSimulator/Devices/0142B3C6-1A4A-4584-8A98-C792E87DFCDD/data/Containers/Bundle/Application/F5EBD18C-E7CE-464C-BC35-BBDD2B698C97/PhilovonFreisinn.app/PhilovonFreisinn.debug.dylib
       0x109ca8000 -        0x10aabbfff react-native.React (1.0) <ac487519-d12b-3ed8-b013-5010ec9bc032> /Users/USER/Library/Developer/CoreSimulator/Devices/0142B3C6-1A4A-4584-8A98-C792E87DFCDD/data/Containers/Bundle/Application/F5EBD18C-E7CE-464C-BC35-BBDD2B698C97/PhilovonFreisinn.app/Frameworks/React.framework/React
       0x102e2c000 -        0x102f93fff third-party.ReactNativeDependencies (1.0) <1c45f8d4-664a-3470-8fd0-341a04b1a28c> /Users/USER/Library/Developer/CoreSimulator/Devices/0142B3C6-1A4A-4584-8A98-C792E87DFCDD/data/Containers/Bundle/Application/F5EBD18C-E7CE-464C-BC35-BBDD2B698C97/PhilovonFreisinn.app/Frameworks/ReactNativeDependencies.framework/ReactNativeDependencies
       0x10384c000 -        0x103bd3fff dev.hermesengine.iphonesimulator (0.12.0) <944bd49b-ad2e-3e3c-96ac-0603909fdd97> /Users/USER/Library/Developer/CoreSimulator/Devices/0142B3C6-1A4A-4584-8A98-C792E87DFCDD/data/Containers/Bundle/Application/F5EBD18C-E7CE-464C-BC35-BBDD2B698C97/PhilovonFreisinn.app/Frameworks/hermes.framework/hermes
       0x1026c8000 -        0x1026cffff libsystem_platform.dylib (*) <9463fc06-cc7c-38e8-ad3c-1b9f2617df53> /usr/lib/system/libsystem_platform.dylib
       0x102834000 -        0x10286ffff libsystem_kernel.dylib (*) <1a15cc38-efcc-34ea-a261-cfd370f4b557> /usr/lib/system/libsystem_kernel.dylib
       0x102664000 -        0x102673fff libsystem_pthread.dylib (*) <b1095734-2a4d-3e8c-839e-b10ae9598d61> /usr/lib/system/libsystem_pthread.dylib
       0x102ad4000 -        0x102adffff libobjc-trampolines.dylib (*) <5456a55f-46e1-386f-a22e-35e385923f2d> /Volumes/VOLUME/*/libobjc-trampolines.dylib
       0x18038b000 -        0x18075afff com.apple.CoreFoundation (6.9) <5f40c0e3-6b50-30c6-a686-3ab03c9a5404> /Volumes/VOLUME/*/CoreFoundation.framework/CoreFoundation
       0x190180000 -        0x190188fff com.apple.GraphicsServices (1.0) <587e9fae-3ada-346c-a206-e2949d400fff> /Volumes/VOLUME/*/GraphicsServices.framework/GraphicsServices
       0x184c81000 -        0x186976fff com.apple.UIKitCore (1.0) <d41f23e0-fb5e-33e4-9687-bb277a61190f> /Volumes/VOLUME/*/UIKitCore.framework/UIKitCore
               0x0 - 0xffffffffffffffff ??? (*) <00000000-0000-0000-0000-000000000000> ???
       0x1807da000 -        0x181420fff com.apple.Foundation (6.9) <1a4bc02e-f4dc-3ab5-9bb7-61d28064ffe8> /Volumes/VOLUME/*/Foundation.framework/Foundation
       0x1802e3000 -        0x180365ff3 libc++.1.dylib (*) <c996ec67-9783-3d31-85ad-67b6bda4349c> /Volumes/VOLUME/*/libc++.1.dylib
       0x1847b2000 -        0x184b30fff com.apple.CFNetwork (1.0) <722d2929-fe22-39d0-81cf-4cf7e2bb9caa> /Volumes/VOLUME/*/CFNetwork.framework/CFNetwork

External Modification Summary:
  Calls made by other processes targeting this process:
    task_for_pid: 0
    thread_create: 0
    thread_set_state: 0
  Calls made by this process:
    task_for_pid: 0
    thread_create: 0
    thread_set_state: 0
  Calls made by all processes on this machine:
    task_for_pid: 0
    thread_create: 0
    thread_set_state: 0

VM Region Summary:
ReadOnly portion of Libraries: Total=1.6G resident=0K(0%) swapped_out_or_unallocated=1.6G(100%)
Writable regions: Total=4.8G written=5567K(0%) resident=3967K(0%) swapped_out=1600K(0%) unallocated=4.8G(100%)

                                VIRTUAL   REGION 
REGION TYPE                        SIZE    COUNT (non-coalesced) 
===========                     =======  ======= 
Activity Tracing                   256K        1 
CG raster data                    19.0M       24 
ColorSync                          144K        5 
CoreAnimation                     63.9M      201 
Foundation                          16K        1 
IOSurface                          624K        1 
Kernel Alloc Once                   32K        1 
MALLOC                             4.4G      253 
MALLOC guard page                  288K       18 
SQLite page cache                 1024K        8 
STACK GUARD                       56.2M       14 
Stack                             15.4M       14 
VM_ALLOCATE                      266.0M      201 
__DATA                            30.1M      769 
__DATA_CONST                      84.9M      787 
__DATA_DIRTY                       139K       11 
__FONT_DATA                        2352        1 
__LINKEDIT                       735.8M       11 
__OBJC_RW                         2686K        1 
__TEXT                           877.7M      800 
__TPRO_CONST                       148K        2 
dyld private memory                2.6G       24 
libnetwork                         128K        8 
mapped file                      441.8M      287 
page table in kernel              3967K        1 
shared memory                       16K        1 
===========                     =======  ======= 
TOTAL                              9.6G     3445 


-----------
Full Report
-----------

{"app_name":"PhilovonFreisinn","timestamp":"2026-08-23 10:49:16.00 +0200","app_version":"1.0.0","slice_uuid":"da21dc10-e669-35ed-82f6-f025f770edb3","build_version":"1","platform":7,"bundleID":"berlin.cypherpunkacademy.ragapp","share_with_app_devs":0,"is_first_party":0,"bug_type":"309","os_version":"macOS 26.3 (25D125)","roots_installed":0,"name":"PhilovonFreisinn","incident_id":"F84B3C1E-4BDE-4D5A-B28E-E4ED6B3E5387"}
{
  "uptime" : 270000,
  "procRole" : "Foreground",
  "version" : 2,
  "userID" : 501,
  "deployVersion" : 210,
  "modelCode" : "MacBookPro18,4",
  "coalitionID" : 1363,
  "osVersion" : {
    "train" : "macOS 26.3",
    "build" : "25D125",
    "releaseType" : "User"
  },
  "captureTime" : "2026-08-23 10:49:01.7649 +0200",
  "codeSigningMonitor" : 1,
  "incident" : "F84B3C1E-4BDE-4D5A-B28E-E4ED6B3E5387",
  "pid" : 52554,
  "translated" : false,
  "cpuType" : "ARM-64",
  "procLaunch" : "2026-08-23 10:12:04.9996 +0200",
  "procStartAbsTime" : 6618694560384,
  "procExitAbsTime" : 6671895574525,
  "procName" : "PhilovonFreisinn",
  "procPath" : "\/Users\/USER\/Library\/Developer\/CoreSimulator\/Devices\/0142B3C6-1A4A-4584-8A98-C792E87DFCDD\/data\/Containers\/Bundle\/Application\/F5EBD18C-E7CE-464C-BC35-BBDD2B698C97\/PhilovonFreisinn.app\/PhilovonFreisinn",
  "bundleInfo" : {"CFBundleShortVersionString":"1.0.0","CFBundleVersion":"1","CFBundleIdentifier":"berlin.cypherpunkacademy.ragapp"},
  "storeInfo" : {"deviceIdentifierForVendor":"667968DF-AE92-5BF8-9A51-92A93D0A1BE3","thirdParty":true},
  "parentProc" : "launchd_sim",
  "parentPid" : 15429,
  "coalitionName" : "com.apple.CoreSimulator.SimDevice.0142B3C6-1A4A-4584-8A98-C792E87DFCDD",
  "crashReporterKey" : "DBCD073F-0252-52E5-2F74-24875E97A8A0",
  "appleIntelligenceStatus" : {"reasons":["siriAssetIsNotReady","assetIsNotReady","notOptedIn"],"state":"unavailable"},
  "developerMode" : 1,
  "responsiblePid" : 15419,
  "responsibleProc" : "SimulatorTrampoline",
  "codeSigningID" : "berlin.cypherpunkacademy.ragapp",
  "codeSigningTeamID" : "",
  "codeSigningFlags" : 570425857,
  "codeSigningValidationCategory" : 10,
  "codeSigningTrustLevel" : 4294967295,
  "codeSigningAuxiliaryInfo" : 0,
  "instructionByteStream" : {"beforePC":"\/8MAkcADX9b\/gwDR4A8A+egPQPkJAICS6QsA+ekLQPkIAen4CAEJiw==","atPC":"6AcA+eAHQPn\/gwCRwANf1v8DAdH9ewOp\/cMAkaCDH\/ihAx\/4qINf+A=="},
  "bootSessionUUID" : "6A436DB3-19E8-445E-B0AA-4B8F6E2FB022",
  "wakeTime" : 56234,
  "sleepWakeUUID" : "04462BF1-759F-4070-A94B-393E5F769F66",
  "sip" : "enabled",
  "vmRegionInfo" : "0x16e2a7ff8 is in 0x16e2a4000-0x16e2a8000;  bytes after start: 16376  bytes before end: 7\n      REGION TYPE                    START - END         [ VSIZE] PRT\/MAX SHRMOD  REGION DETAIL\n      CoreAnimation               16e2a0000-16e2a4000    [   16K] r--\/r-- SM=PRV  \n--->  STACK GUARD                 16e2a4000-16e2a8000    [   16K] ---\/rwx SM=NUL  stack guard for thread 2\n      Stack                       16e2a8000-16e3b0000    [ 1056K] rw-\/rwx SM=PRV  thread 2",
  "exception" : {"codes":"0x0000000000000002, 0x000000016e2a7ff8","message":"Thread stack size exceeded due to excessive recursion","rawCodes":[2,6143246328],"type":"EXC_BAD_ACCESS","signal":"SIGBUS","subtype":"KERN_PROTECTION_FAILURE at 0x000000016e2a7ff8"},
  "termination" : {"flags":0,"code":10,"namespace":"SIGNAL","indicator":"Bus error: 10","byProc":"exc handler","byPid":52554},
  "vmregioninfo" : "0x16e2a7ff8 is in 0x16e2a4000-0x16e2a8000;  bytes after start: 16376  bytes before end: 7\n      REGION TYPE                    START - END         [ VSIZE] PRT\/MAX SHRMOD  REGION DETAIL\n      CoreAnimation               16e2a0000-16e2a4000    [   16K] r--\/r-- SM=PRV  \n--->  STACK GUARD                 16e2a4000-16e2a8000    [   16K] ---\/rwx SM=NUL  stack guard for thread 2\n      Stack                       16e2a8000-16e3b0000    [ 1056K] rw-\/rwx SM=PRV  thread 2",
  "extMods" : {"caller":{"thread_create":0,"thread_set_state":0,"task_for_pid":0},"system":{"thread_create":0,"thread_set_state":0,"task_for_pid":0},"targeted":{"thread_create":0,"thread_set_state":0,"task_for_pid":0},"warnings":0},
  "faultingThread" : 2,
  "threads" : [{"id":17785950,"threadState":{"x":[{"value":268451845},{"value":21592279046},{"value":8589934592},{"value":37396280246272},{"value":0},{"value":37396280246272},{"value":2},{"value":4294967295},{"value":0},{"value":17179869184},{"value":0},{"value":2},{"value":0},{"value":0},{"value":8707},{"value":3072},{"value":18446744073709551569},{"value":144036023272194},{"value":0},{"value":4294967295},{"value":2},{"value":37396280246272},{"value":0},{"value":37396280246272},{"value":6131748728},{"value":8589934592},{"value":21592279046},{"value":18446744073709550527},{"value":4412409862}],"flavor":"ARM_THREAD_STATE64","lr":{"value":4337195276},"cpsr":{"value":4096},"fp":{"value":6131748576},"sp":{"value":6131748496},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":4337126256},"far":{"value":0}},"queue":"com.apple.main-thread","frames":[{"imageOffset":2928,"symbol":"mach_msg2_trap","symbolLocation":8,"imageIndex":7},{"imageOffset":71948,"symbol":"mach_msg2_internal","symbolLocation":72,"imageIndex":7},{"imageOffset":35856,"symbol":"mach_msg_overwrite","symbolLocation":480,"imageIndex":7},{"imageOffset":3812,"symbol":"mach_msg","symbolLocation":20,"imageIndex":7},{"imageOffset":588640,"symbol":"__CFRunLoopServiceMachPort","symbolLocation":156,"imageIndex":10},{"imageOffset":565796,"symbol":"__CFRunLoopRun","symbolLocation":1160,"imageIndex":10},{"imageOffset":563552,"symbol":"CFRunLoopRunSpecific","symbolLocation":536,"imageIndex":10},{"imageOffset":15120,"symbol":"GSEventRunModal","symbolLocation":160,"imageIndex":11},{"imageOffset":14818112,"symbol":"-[UIApplication _run]","symbolLocation":796,"imageIndex":12},{"imageOffset":14835000,"symbol":"UIApplicationMain","symbolLocation":124,"imageIndex":12},{"imageOffset":19072,"sourceLine":6,"sourceFile":"AppDelegate.swift","symbol":"__debug_main_executable_dylib_entry_point","imageIndex":2,"symbolLocation":64},{"imageOffset":4338832400,"imageIndex":13},{"imageOffset":36180,"symbol":"start","symbolLocation":7184,"imageIndex":0}]},{"id":17786018,"name":"com.apple.uikit.eventfetch-thread","threadState":{"x":[{"value":268451845},{"value":21592279046},{"value":8589934592},{"value":64884070940672},{"value":0},{"value":64884070940672},{"value":2},{"value":4294967295},{"value":0},{"value":17179869184},{"value":0},{"value":2},{"value":0},{"value":0},{"value":15107},{"value":3072},{"value":18446744073709551569},{"value":2},{"value":0},{"value":4294967295},{"value":2},{"value":64884070940672},{"value":0},{"value":64884070940672},{"value":6134029688},{"value":8589934592},{"value":21592279046},{"value":18446744073709550527},{"value":4412409862}],"flavor":"ARM_THREAD_STATE64","lr":{"value":4337195276},"cpsr":{"value":4096},"fp":{"value":6134029536},"sp":{"value":6134029456},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":4337126256},"far":{"value":0}},"frames":[{"imageOffset":2928,"symbol":"mach_msg2_trap","symbolLocation":8,"imageIndex":7},{"imageOffset":71948,"symbol":"mach_msg2_internal","symbolLocation":72,"imageIndex":7},{"imageOffset":35856,"symbol":"mach_msg_overwrite","symbolLocation":480,"imageIndex":7},{"imageOffset":3812,"symbol":"mach_msg","symbolLocation":20,"imageIndex":7},{"imageOffset":588640,"symbol":"__CFRunLoopServiceMachPort","symbolLocation":156,"imageIndex":10},{"imageOffset":565796,"symbol":"__CFRunLoopRun","symbolLocation":1160,"imageIndex":10},{"imageOffset":563552,"symbol":"CFRunLoopRunSpecific","symbolLocation":536,"imageIndex":10},{"imageOffset":7671588,"symbol":"-[NSRunLoop(NSRunLoop) runMode:beforeDate:]","symbolLocation":208,"imageIndex":14},{"imageOffset":7672132,"symbol":"-[NSRunLoop(NSRunLoop) runUntilDate:]","symbolLocation":60,"imageIndex":14},{"imageOffset":15522952,"symbol":"-[UIEventFetcher threadMain]","symbolLocation":404,"imageIndex":12},{"imageOffset":7830892,"symbol":"__NSThread__start__","symbolLocation":720,"imageIndex":14},{"imageOffset":26028,"symbol":"_pthread_start","symbolLocation":104,"imageIndex":8},{"imageOffset":6552,"symbol":"thread_start","symbolLocation":8,"imageIndex":8}]},{"frames":[{"imageOffset":7391124,"symbol":"long std::__1::__libcpp_atomic_refcount_decrement[abi:de180100]<long>(long&)","symbolLocation":32,"imageIndex":3},{"imageOffset":7391000,"symbol":"std::__1::__shared_count::__release_shared[abi:de180100]()","symbolLocation":32,"imageIndex":3},{"imageOffset":7390936,"symbol":"std::__1::__shared_weak_count::__release_shared[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":7424660,"symbol":"std::__1::shared_ptr<void>::~shared_ptr[abi:de180100]()","symbolLocation":64,"imageIndex":3},{"imageOffset":7424580,"symbol":"std::__1::shared_ptr<void>::~shared_ptr[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":7424536,"symbol":"facebook::react::Color::~Color()","symbolLocation":28,"imageIndex":3},{"imageOffset":7424492,"symbol":"facebook::react::Color::~Color()","symbolLocation":28,"imageIndex":3},{"imageOffset":7424448,"symbol":"facebook::react::SharedColor::~SharedColor()","symbolLocation":28,"imageIndex":3},{"imageOffset":7408020,"symbol":"facebook::react::SharedColor::~SharedColor()","symbolLocation":28,"imageIndex":3},{"imageOffset":7909044,"symbol":"facebook::react::TextAttributes::~TextAttributes()","symbolLocation":84,"imageIndex":3},{"imageOffset":7908872,"symbol":"facebook::react::TextAttributes::~TextAttributes()","symbolLocation":28,"imageIndex":3},{"imageOffset":7913852,"symbol":"facebook::react::AttributedString::~AttributedString()","symbolLocation":48,"imageIndex":3},{"imageOffset":7901624,"symbol":"facebook::react::AttributedString::~AttributedString()","symbolLocation":28,"imageIndex":3},{"imageOffset":8064932,"symbol":"facebook::react::TextInputState::~TextInputState()","symbolLocation":44,"imageIndex":3},{"imageOffset":8042932,"symbol":"facebook::react::TextInputState::~TextInputState()","symbolLocation":28,"imageIndex":3},{"imageOffset":8090316,"symbol":"void std::__1::__destroy_at[abi:de180100]<facebook::react::TextInputState const, 0>(facebook::react::TextInputState const*)","symbolLocation":52,"imageIndex":3},{"imageOffset":8090252,"symbol":"void std::__1::allocator_traits<std::__1::allocator<facebook::react::TextInputState const>>::destroy[abi:de180100]<facebook::react::TextInputState const, void, void>(std::__1::allocator<facebook::react::TextInputState const>&, facebook::react::TextInputState const*)","symbolLocation":28,"imageIndex":3},{"imageOffset":8090204,"symbol":"void std::__1::__shared_ptr_emplace<facebook::react::TextInputState const, std::__1::allocator<facebook::react::TextInputState const>>::__on_zero_shared_impl[abi:de180100]<std::__1::allocator<facebook::react::TextInputState const>, 0>()","symbolLocation":48,"imageIndex":3},{"imageOffset":8089528,"symbol":"std::__1::__shared_ptr_emplace<facebook::react::TextInputState const, std::__1::allocator<facebook::react::TextInputState const>>::__on_zero_shared()","symbolLocation":24,"imageIndex":3},{"imageOffset":7391032,"symbol":"std::__1::__shared_count::__release_shared[abi:de180100]()","symbolLocation":64,"imageIndex":3},{"imageOffset":7390936,"symbol":"std::__1::__shared_weak_count::__release_shared[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":7437556,"symbol":"std::__1::shared_ptr<void const>::~shared_ptr[abi:de180100]()","symbolLocation":64,"imageIndex":3},{"imageOffset":7437388,"symbol":"std::__1::shared_ptr<void const>::~shared_ptr[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":7556800,"symbol":"facebook::react::State::~State()","symbolLocation":48,"imageIndex":3},{"imageOffset":8087328,"symbol":"facebook::react::ConcreteState<facebook::react::TextInputState>::~ConcreteState()","symbolLocation":28,"imageIndex":3},{"imageOffset":8087172,"symbol":"facebook::react::ConcreteState<facebook::react::TextInputState>::~ConcreteState()","symbolLocation":28,"imageIndex":3},{"imageOffset":8087628,"symbol":"void std::__1::__destroy_at[abi:de180100]<facebook::react::ConcreteState<facebook::react::TextInputState> const, 0>(facebook::react::ConcreteState<facebook::react::TextInputState> const*)","symbolLocation":60,"imageIndex":3},{"imageOffset":8087556,"symbol":"void std::__1::allocator_traits<std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>>::destroy[abi:de180100]<facebook::react::ConcreteState<facebook::react::TextInputState> const, void, void>(std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>&, facebook::react::ConcreteState<facebook::react::TextInputState> const*)","symbolLocation":28,"imageIndex":3},{"imageOffset":8087508,"symbol":"void std::__1::__shared_ptr_emplace<facebook::react::ConcreteState<facebook::react::TextInputState> const, std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>>::__on_zero_shared_impl[abi:de180100]<std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>, 0>()","symbolLocation":48,"imageIndex":3},{"imageOffset":8086340,"symbol":"std::__1::__shared_ptr_emplace<facebook::react::ConcreteState<facebook::react::TextInputState> const, std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>>::__on_zero_shared()","symbolLocation":24,"imageIndex":3},{"imageOffset":7391032,"symbol":"std::__1::__shared_count::__release_shared[abi:de180100]()","symbolLocation":64,"imageIndex":3},{"imageOffset":7390936,"symbol":"std::__1::__shared_weak_count::__release_shared[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":7444824,"symbol":"std::__1::shared_ptr<facebook::react::State const>::~shared_ptr[abi:de180100]()","symbolLocation":64,"imageIndex":3},{"imageOffset":7444488,"symbol":"std::__1::shared_ptr<facebook::react::State const>::~shared_ptr[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":7908920,"symbol":"facebook::react::ShadowView::~ShadowView()","symbolLocation":32,"imageIndex":3},{"imageOffset":7908828,"symbol":"facebook::react::ShadowView::~ShadowView()","symbolLocation":28,"imageIndex":3},{"imageOffset":7908764,"symbol":"facebook::react::AttributedString::Fragment::~Fragment()","symbolLocation":32,"imageIndex":3},{"imageOffset":7908716,"symbol":"facebook::react::AttributedString::Fragment::~Fragment()","symbolLocation":28,"imageIndex":3},{"imageOffset":7908676,"symbol":"void std::__1::__destroy_at[abi:de180100]<facebook::react::AttributedString::Fragment, 0>(facebook::react::AttributedString::Fragment*)","symbolLocation":52,"imageIndex":3},{"imageOffset":7908520,"symbol":"void std::__1::allocator_traits<std::__1::allocator<facebook::react::AttributedString::Fragment>>::destroy[abi:de180100]<facebook::react::AttributedString::Fragment, void, void>(std::__1::allocator<facebook::react::AttributedString::Fragment>&, facebook::react::AttributedString::Fragment*)","symbolLocation":28,"imageIndex":3},{"imageOffset":7911040,"symbol":"std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::__base_destruct_at_end[abi:de180100](facebook::react::AttributedString::Fragment*)","symbolLocation":104,"imageIndex":3},{"imageOffset":7911300,"symbol":"std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::__clear[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":7913520,"symbol":"std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::__destroy_vector::operator()[abi:de180100]()","symbolLocation":60,"imageIndex":3},{"imageOffset":7913648,"symbol":"std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::~vector[abi:de180100]()","symbolLocation":44,"imageIndex":3},{"imageOffset":7912528,"symbol":"std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::~vector[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":7913864,"symbol":"facebook::react::AttributedString::~AttributedString()","symbolLocation":60,"imageIndex":3},{"imageOffset":7901624,"symbol":"facebook::react::AttributedString::~AttributedString()","symbolLocation":28,"imageIndex":3},{"imageOffset":8064932,"symbol":"facebook::react::TextInputState::~TextInputState()","symbolLocation":44,"imageIndex":3},{"imageOffset":8042932,"symbol":"facebook::react::TextInputState::~TextInputState()","symbolLocation":28,"imageIndex":3},{"imageOffset":8090316,"symbol":"void std::__1::__destroy_at[abi:de180100]<facebook::react::TextInputState const, 0>(facebook::react::TextInputState const*)","symbolLocation":52,"imageIndex":3},{"imageOffset":8090252,"symbol":"void std::__1::allocator_traits<std::__1::allocator<facebook::react::TextInputState const>>::destroy[abi:de180100]<facebook::react::TextInputState const, void, void>(std::__1::allocator<facebook::react::TextInputState const>&, facebook::react::TextInputState const*)","symbolLocation":28,"imageIndex":3},{"imageOffset":8090204,"symbol":"void std::__1::__shared_ptr_emplace<facebook::react::TextInputState const, std::__1::allocator<facebook::react::TextInputState const>>::__on_zero_shared_impl[abi:de180100]<std::__1::allocator<facebook::react::TextInputState const>, 0>()","symbolLocation":48,"imageIndex":3},{"imageOffset":8089528,"symbol":"std::__1::__shared_ptr_emplace<facebook::react::TextInputState const, std::__1::allocator<facebook::react::TextInputState const>>::__on_zero_shared()","symbolLocation":24,"imageIndex":3},{"imageOffset":7391032,"symbol":"std::__1::__shared_count::__release_shared[abi:de180100]()","symbolLocation":64,"imageIndex":3},{"imageOffset":7390936,"symbol":"std::__1::__shared_weak_count::__release_shared[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":7437556,"symbol":"std::__1::shared_ptr<void const>::~shared_ptr[abi:de180100]()","symbolLocation":64,"imageIndex":3},{"imageOffset":7437388,"symbol":"std::__1::shared_ptr<void const>::~shared_ptr[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":7556800,"symbol":"facebook::react::State::~State()","symbolLocation":48,"imageIndex":3},{"imageOffset":8087328,"symbol":"facebook::react::ConcreteState<facebook::react::TextInputState>::~ConcreteState()","symbolLocation":28,"imageIndex":3},{"imageOffset":8087172,"symbol":"facebook::react::ConcreteState<facebook::react::TextInputState>::~ConcreteState()","symbolLocation":28,"imageIndex":3},{"imageOffset":8087628,"symbol":"void std::__1::__destroy_at[abi:de180100]<facebook::react::ConcreteState<facebook::react::TextInputState> const, 0>(facebook::react::ConcreteState<facebook::react::TextInputState> const*)","symbolLocation":60,"imageIndex":3},{"imageOffset":8087556,"symbol":"void std::__1::allocator_traits<std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>>::destroy[abi:de180100]<facebook::react::ConcreteState<facebook::react::TextInputState> const, void, void>(std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>&, facebook::react::ConcreteState<facebook::react::TextInputState> const*)","symbolLocation":28,"imageIndex":3},{"imageOffset":8087508,"symbol":"void std::__1::__shared_ptr_emplace<facebook::react::ConcreteState<facebook::react::TextInputState> const, std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>>::__on_zero_shared_impl[abi:de180100]<std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>, 0>()","symbolLocation":48,"imageIndex":3},{"imageOffset":8086340,"symbol":"std::__1::__shared_ptr_emplace<facebook::react::ConcreteState<facebook::react::TextInputState> const, std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>>::__on_zero_shared()","symbolLocation":24,"imageIndex":3},{"imageOffset":7391032,"symbol":"std::__1::__shared_count::__release_shared[abi:de180100]()","symbolLocation":64,"imageIndex":3},{"imageOffset":7390936,"symbol":"std::__1::__shared_weak_count::__release_shared[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":7444824,"symbol":"std::__1::shared_ptr<facebook::react::State const>::~shared_ptr[abi:de180100]()","symbolLocation":64,"imageIndex":3},{"imageOffset":7444488,"symbol":"std::__1::shared_ptr<facebook::react::State const>::~shared_ptr[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":7908920,"symbol":"facebook::react::ShadowView::~ShadowView()","symbolLocation":32,"imageIndex":3},{"imageOffset":7908828,"symbol":"facebook::react::ShadowView::~ShadowView()","symbolLocation":28,"imageIndex":3},{"imageOffset":7908764,"symbol":"facebook::react::AttributedString::Fragment::~Fragment()","symbolLocation":32,"imageIndex":3},{"imageOffset":7908716,"symbol":"facebook::react::AttributedString::Fragment::~Fragment()","symbolLocation":28,"imageIndex":3},{"imageOffset":7908676,"symbol":"void std::__1::__destroy_at[abi:de180100]<facebook::react::AttributedString::Fragment, 0>(facebook::react::AttributedString::Fragment*)","symbolLocation":52,"imageIndex":3},{"imageOffset":7908520,"symbol":"void std::__1::allocator_traits<std::__1::allocator<facebook::react::AttributedString::Fragment>>::destroy[abi:de180100]<facebook::react::AttributedString::Fragment, void, void>(std::__1::allocator<facebook::react::AttributedString::Fragment>&, facebook::react::AttributedString::Fragment*)","symbolLocation":28,"imageIndex":3},{"imageOffset":7911040,"symbol":"std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::__base_destruct_at_end[abi:de180100](facebook::react::AttributedString::Fragment*)","symbolLocation":104,"imageIndex":3},{"imageOffset":7911300,"symbol":"std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::__clear[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":7913520,"symbol":"std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::__destroy_vector::operator()[abi:de180100]()","symbolLocation":60,"imageIndex":3},{"imageOffset":7913648,"symbol":"std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::~vector[abi:de180100]()","symbolLocation":44,"imageIndex":3},{"imageOffset":7912528,"symbol":"std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::~vector[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":7913864,"symbol":"facebook::react::AttributedString::~AttributedString()","symbolLocation":60,"imageIndex":3},{"imageOffset":7901624,"symbol":"facebook::react::AttributedString::~AttributedString()","symbolLocation":28,"imageIndex":3},{"imageOffset":8064932,"symbol":"facebook::react::TextInputState::~TextInputState()","symbolLocation":44,"imageIndex":3},{"imageOffset":8042932,"symbol":"facebook::react::TextInputState::~TextInputState()","symbolLocation":28,"imageIndex":3},{"imageOffset":8090316,"symbol":"void std::__1::__destroy_at[abi:de180100]<facebook::react::TextInputState const, 0>(facebook::react::TextInputState const*)","symbolLocation":52,"imageIndex":3},{"imageOffset":8090252,"symbol":"void std::__1::allocator_traits<std::__1::allocator<facebook::react::TextInputState const>>::destroy[abi:de180100]<facebook::react::TextInputState const, void, void>(std::__1::allocator<facebook::react::TextInputState const>&, facebook::react::TextInputState const*)","symbolLocation":28,"imageIndex":3},{"imageOffset":8090204,"symbol":"void std::__1::__shared_ptr_emplace<facebook::react::TextInputState const, std::__1::allocator<facebook::react::TextInputState const>>::__on_zero_shared_impl[abi:de180100]<std::__1::allocator<facebook::react::TextInputState const>, 0>()","symbolLocation":48,"imageIndex":3},{"imageOffset":8089528,"symbol":"std::__1::__shared_ptr_emplace<facebook::react::TextInputState const, std::__1::allocator<facebook::react::TextInputState const>>::__on_zero_shared()","symbolLocation":24,"imageIndex":3},{"imageOffset":7391032,"symbol":"std::__1::__shared_count::__release_shared[abi:de180100]()","symbolLocation":64,"imageIndex":3},{"imageOffset":7390936,"symbol":"std::__1::__shared_weak_count::__release_shared[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":7437556,"symbol":"std::__1::shared_ptr<void const>::~shared_ptr[abi:de180100]()","symbolLocation":64,"imageIndex":3},{"imageOffset":7437388,"symbol":"std::__1::shared_ptr<void const>::~shared_ptr[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":7556800,"symbol":"facebook::react::State::~State()","symbolLocation":48,"imageIndex":3},{"imageOffset":8087328,"symbol":"facebook::react::ConcreteState<facebook::react::TextInputState>::~ConcreteState()","symbolLocation":28,"imageIndex":3},{"imageOffset":8087172,"symbol":"facebook::react::ConcreteState<facebook::react::TextInputState>::~ConcreteState()","symbolLocation":28,"imageIndex":3},{"imageOffset":8087628,"symbol":"void std::__1::__destroy_at[abi:de180100]<facebook::react::ConcreteState<facebook::react::TextInputState> const, 0>(facebook::react::ConcreteState<facebook::react::TextInputState> const*)","symbolLocation":60,"imageIndex":3},{"imageOffset":8087556,"symbol":"void std::__1::allocator_traits<std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>>::destroy[abi:de180100]<facebook::react::ConcreteState<facebook::react::TextInputState> const, void, void>(std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>&, facebook::react::ConcreteState<facebook::react::TextInputState> const*)","symbolLocation":28,"imageIndex":3},{"imageOffset":8087508,"symbol":"void std::__1::__shared_ptr_emplace<facebook::react::ConcreteState<facebook::react::TextInputState> const, std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>>::__on_zero_shared_impl[abi:de180100]<std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>, 0>()","symbolLocation":48,"imageIndex":3},{"imageOffset":8086340,"symbol":"std::__1::__shared_ptr_emplace<facebook::react::ConcreteState<facebook::react::TextInputState> const, std::__1::allocator<facebook::react::ConcreteState<facebook::react::TextInputState> const>>::__on_zero_shared()","symbolLocation":24,"imageIndex":3},{"imageOffset":8807456,"symbol":"std::__1::__shared_count::__release_shared[abi:de180100]()","symbolLocation":64,"imageIndex":3},{"imageOffset":8807360,"symbol":"std::__1::__shared_weak_count::__release_shared[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":8812208,"symbol":"std::__1::shared_ptr<facebook::react::State const>::~shared_ptr[abi:de180100]()","symbolLocation":64,"imageIndex":3},{"imageOffset":8811852,"symbol":"std::__1::shared_ptr<facebook::react::State const>::~shared_ptr[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":8947392,"symbol":"facebook::react::ShadowView::~ShadowView()","symbolLocation":32,"imageIndex":3},{"imageOffset":8944720,"symbol":"facebook::react::ShadowView::~ShadowView()","symbolLocation":28,"imageIndex":3},{"imageOffset":8947464,"symbol":"facebook::react::AttributedString::Fragment::~Fragment()","symbolLocation":32,"imageIndex":3},{"imageOffset":8944764,"symbol":"facebook::react::AttributedString::Fragment::~Fragment()","symbolLocation":28,"imageIndex":3},{"imageOffset":9038660,"symbol":"void std::__1::__destroy_at[abi:de180100]<facebook::react::AttributedString::Fragment, 0>(facebook::react::AttributedString::Fragment*)","symbolLocation":52,"imageIndex":3},{"imageOffset":9038576,"symbol":"void std::__1::allocator_traits<std::__1::allocator<facebook::react::AttributedString::Fragment>>::destroy[abi:de180100]<facebook::react::AttributedString::Fragment, void, void>(std::__1::allocator<facebook::react::AttributedString::Fragment>&, facebook::react::AttributedString::Fragment*)","symbolLocation":28,"imageIndex":3},{"imageOffset":9038512,"symbol":"std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::__base_destruct_at_end[abi:de180100](facebook::react::AttributedString::Fragment*)","symbolLocation":104,"imageIndex":3},{"imageOffset":9038224,"symbol":"std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::__clear[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":9038080,"symbol":"std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::__destroy_vector::operator()[abi:de180100]()","symbolLocation":60,"imageIndex":3},{"imageOffset":9037944,"symbol":"std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::~vector[abi:de180100]()","symbolLocation":44,"imageIndex":3},{"imageOffset":9037548,"symbol":"std::__1::vector<facebook::react::AttributedString::Fragment, std::__1::allocator<facebook::react::AttributedString::Fragment>>::~vector[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":9047756,"symbol":"facebook::react::AttributedString::~AttributedString()","symbolLocation":60,"imageIndex":3},{"imageOffset":9028300,"symbol":"facebook::react::AttributedString::~AttributedString()","symbolLocation":28,"imageIndex":3},{"imageOffset":9323472,"symbol":"facebook::react::TextMeasureCacheKey::~TextMeasureCacheKey()","symbolLocation":40,"imageIndex":3},{"imageOffset":9314752,"symbol":"facebook::react::TextMeasureCacheKey::~TextMeasureCacheKey()","symbolLocation":28,"imageIndex":3},{"imageOffset":9322748,"symbol":"std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>::~pair()","symbolLocation":40,"imageIndex":3},{"imageOffset":9322692,"symbol":"std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>::~pair()","symbolLocation":28,"imageIndex":3},{"imageOffset":9322652,"symbol":"void std::__1::__destroy_at[abi:de180100]<std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>, 0>(std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>*)","symbolLocation":52,"imageIndex":3},{"imageOffset":9322392,"symbol":"void std::__1::allocator_traits<std::__1::allocator<std::__1::__list_node<std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>, void*>>>::destroy[abi:de180100]<std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>, void, void>(std::__1::allocator<std::__1::__list_node<std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>, void*>>&, std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>*)","symbolLocation":28,"imageIndex":3},{"imageOffset":9322100,"symbol":"void std::__1::__list_imp<std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>, std::__1::allocator<std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>>>::__delete_node[abi:de180100]<>(std::__1::__list_node<std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>, void*>*)","symbolLocation":60,"imageIndex":3},{"imageOffset":9329432,"symbol":"std::__1::list<std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>, std::__1::allocator<std::__1::pair<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement>>>::pop_back()","symbolLocation":108,"imageIndex":3},{"imageOffset":9314528,"symbol":"facebook::react::TextMeasurement facebook::react::SimpleThreadSafeCache<facebook::react::TextMeasureCacheKey, facebook::react::TextMeasurement, 1024>::get<facebook::react::TextLayoutManager::measure(facebook::react::AttributedStringBox const&, facebook::react::ParagraphAttributes const&, facebook::react::TextLayoutContext const&, facebook::react::LayoutConstraints const&) const::$_0>(facebook::react::TextMeasureCacheKey const&, facebook::react::TextLayoutManager::measure(facebook::react::AttributedStringBox const&, facebook::react::ParagraphAttributes const&, facebook::react::TextLayoutContext const&, facebook::react::LayoutConstraints const&) const::$_0) const","symbolLocation":536,"imageIndex":3},{"imageOffset":9312968,"symbol":"facebook::react::TextLayoutManager::measure(facebook::react::AttributedStringBox const&, facebook::react::ParagraphAttributes const&, facebook::react::TextLayoutContext const&, facebook::react::LayoutConstraints const&) const","symbolLocation":344,"imageIndex":3},{"imageOffset":8077856,"symbol":"facebook::react::BaseTextInputShadowNode<&facebook::react::TextInputComponentName, facebook::react::TextInputProps, facebook::react::TextInputEventEmitter, facebook::react::TextInputState>::measureContent(facebook::react::LayoutContext const&, facebook::react::LayoutConstraints const&) const","symbolLocation":196,"imageIndex":3},{"imageOffset":5745612,"symbol":"facebook::react::YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector(YGNode const*, float, YGMeasureMode, float, YGMeasureMode)","symbolLocation":464,"imageIndex":3},{"imageOffset":311144,"symbol":"facebook::yoga::Node::measure(float, facebook::yoga::MeasureMode, float, facebook::yoga::MeasureMode)","symbolLocation":112,"imageIndex":3},{"imageOffset":268600,"symbol":"facebook::yoga::measureNodeWithMeasureFunc(facebook::yoga::Node*, facebook::yoga::Direction, float, float, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, facebook::yoga::LayoutData&, facebook::yoga::LayoutPassReason)","symbolLocation":756,"imageIndex":3},{"imageOffset":255932,"symbol":"facebook::yoga::calculateLayoutImpl(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int)","symbolLocation":1060,"imageIndex":3},{"imageOffset":254036,"symbol":"facebook::yoga::calculateLayoutInternal(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int)","symbolLocation":1560,"imageIndex":3},{"imageOffset":279084,"symbol":"facebook::yoga::computeFlexBasisForChild(facebook::yoga::Node const*, facebook::yoga::Node*, float, facebook::yoga::SizingMode, float, float, float, facebook::yoga::SizingMode, facebook::yoga::Direction, facebook::yoga::LayoutData&, unsigned int, unsigned int)","symbolLocation":2200,"imageIndex":3},{"imageOffset":272072,"symbol":"facebook::yoga::computeFlexBasisForChildren(facebook::yoga::Node*, float, float, facebook::yoga::SizingMode, facebook::yoga::SizingMode, facebook::yoga::Direction, facebook::yoga::FlexDirection, bool, facebook::yoga::LayoutData&, unsigned int, unsigned int)","symbolLocation":1072,"imageIndex":3},{"imageOffset":256844,"symbol":"facebook::yoga::calculateLayoutImpl(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int)","symbolLocation":1972,"imageIndex":3},{"imageOffset":254036,"symbol":"facebook::yoga::calculateLayoutInternal(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int)","symbolLocation":1560,"imageIndex":3},{"imageOffset":279084,"symbol":"facebook::yoga::computeFlexBasisForChild(facebook::yoga::Node const*, facebook::yoga::Node*, float, facebook::yoga::SizingMode, float, float, float, facebook::yoga::SizingMode, facebook::yoga::Direction, facebook::yoga::LayoutData&, unsigned int, unsigned int)","symbolLocation":2200,"imageIndex":3},{"imageOffset":272072,"symbol":"facebook::yoga::computeFlexBasisForChildren(facebook::yoga::Node*, float, float, facebook::yoga::SizingMode, facebook::yoga::SizingMode, facebook::yoga::Direction, facebook::yoga::FlexDirection, bool, facebook::yoga::LayoutData&, unsigned int, unsigned int)","symbolLocation":1072,"imageIndex":3},{"imageOffset":256844,"symbol":"facebook::yoga::calculateLayoutImpl(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int)","symbolLocation":1972,"imageIndex":3},{"imageOffset":254036,"symbol":"facebook::yoga::calculateLayoutInternal(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int)","symbolLocation":1560,"imageIndex":3},{"imageOffset":259932,"symbol":"facebook::yoga::calculateLayoutImpl(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int)","symbolLocation":5060,"imageIndex":3},{"imageOffset":254036,"symbol":"facebook::yoga::calculateLayoutInternal(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int)","symbolLocation":1560,"imageIndex":3},{"imageOffset":259932,"symbol":"facebook::yoga::calculateLayoutImpl(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int)","symbolLocation":5060,"imageIndex":3},{"imageOffset":254036,"symbol":"facebook::yoga::calculateLayoutInternal(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int)","symbolLocation":1560,"imageIndex":3},{"imageOffset":259932,"symbol":"facebook::yoga::calculateLayoutImpl(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int)","symbolLocation":5060,"imageIndex":3},{"imageOffset":254036,"symbol":"facebook::yoga::calculateLayoutInternal(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int)","symbolLocation":1560,"imageIndex":3},{"imageOffset":267416,"symbol":"facebook::yoga::calculateLayout(facebook::yoga::Node*, float, float, facebook::yoga::Direction)","symbolLocation":896,"imageIndex":3},{"imageOffset":155808,"symbol":"YGNodeCalculateLayout","symbolLocation":88,"imageIndex":3},{"imageOffset":5766548,"symbol":"facebook::react::YogaLayoutableShadowNode::layoutTree(facebook::react::LayoutContext, facebook::react::LayoutConstraints)","symbolLocation":2792,"imageIndex":3},{"imageOffset":4817432,"symbol":"facebook::react::RootShadowNode::layoutIfNeeded(std::__1::vector<facebook::react::LayoutableShadowNode const*, std::__1::allocator<facebook::react::LayoutableShadowNode const*>>*)","symbolLocation":268,"imageIndex":3},{"imageOffset":6319276,"symbol":"facebook::react::ShadowTree::tryCommit(std::__1::function<std::__1::shared_ptr<facebook::react::RootShadowNode> (facebook::react::RootShadowNode const&)> const&, facebook::react::ShadowTreeCommitOptions const&) const","symbolLocation":724,"imageIndex":3},{"imageOffset":6318280,"symbol":"facebook::react::ShadowTree::commit(std::__1::function<std::__1::shared_ptr<facebook::react::RootShadowNode> (facebook::react::RootShadowNode const&)> const&, facebook::react::ShadowTreeCommitOptions const&) const","symbolLocation":256,"imageIndex":3},{"imageOffset":6917052,"symbol":"facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)::$_0::operator()(facebook::react::ShadowTree const&) const","symbolLocation":108,"imageIndex":3},{"imageOffset":6916932,"symbol":"decltype(std::declval<facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)::$_0&>()(std::declval<facebook::react::ShadowTree const&>())) std::__1::__invoke[abi:de180100]<facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)::$_0&, facebook::react::ShadowTree const&>(facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)::$_0&, facebook::react::ShadowTree const&)","symbolLocation":32,"imageIndex":3},{"imageOffset":6916852,"symbol":"void std::__1::__invoke_void_return_wrapper<void, true>::__call[abi:de180100]<facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)::$_0&, facebook::react::ShadowTree const&>(facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)::$_0&, facebook::react::ShadowTree const&)","symbolLocation":32,"imageIndex":3},{"imageOffset":6916808,"symbol":"std::__1::__function::__alloc_func<facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)::$_0, std::__1::allocator<facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)::$_0>, void (facebook::react::ShadowTree const&)>::operator()[abi:de180100](facebook::react::ShadowTree const&)","symbolLocation":36,"imageIndex":3},{"imageOffset":6912712,"symbol":"std::__1::__function::__func<facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)::$_0, std::__1::allocator<facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)::$_0>, void (facebook::react::ShadowTree const&)>::operator()(facebook::react::ShadowTree const&)","symbolLocation":36,"imageIndex":3},{"imageOffset":6375856,"symbol":"std::__1::__function::__value_func<void (facebook::react::ShadowTree const&)>::operator()[abi:de180100](facebook::react::ShadowTree const&) const","symbolLocation":76,"imageIndex":3},{"imageOffset":6364076,"symbol":"std::__1::function<void (facebook::react::ShadowTree const&)>::operator()(facebook::react::ShadowTree const&) const","symbolLocation":32,"imageIndex":3},{"imageOffset":6363980,"symbol":"facebook::react::ShadowTreeRegistry::visit(int, std::__1::function<void (facebook::react::ShadowTree const&)> const&) const","symbolLocation":248,"imageIndex":3},{"imageOffset":6868708,"symbol":"facebook::react::UIManager::completeSurface(int, std::__1::shared_ptr<std::__1::vector<std::__1::shared_ptr<facebook::react::ShadowNode const>, std::__1::allocator<std::__1::shared_ptr<facebook::react::ShadowNode const>>>> const&, facebook::react::ShadowTreeCommitOptions)","symbolLocation":168,"imageIndex":3},{"imageOffset":7164012,"symbol":"facebook::react::UIManagerBinding::get(facebook::jsi::Runtime&, facebook::jsi::PropNameID const&)::$_9::operator()(facebook::jsi::Runtime&, facebook::jsi::Value const&, facebook::jsi::Value const*, unsigned long) const","symbolLocation":176,"imageIndex":3},{"imageOffset":7163824,"symbol":"decltype(std::declval<facebook::react::UIManagerBinding::get(facebook::jsi::Runtime&, facebook::jsi::PropNameID const&)::$_9&>()(std::declval<facebook::jsi::Runtime&>(), std::declval<facebook::jsi::Value const&>(), std::declval<facebook::jsi::Value const*>(), std::declval<unsigned long>())) std::__1::__invoke[abi:de180100]<facebook::react::UIManagerBinding::get(facebook::jsi::Runtime&, facebook::jsi::PropNameID const&)::$_9&, facebook::jsi::Runtime&, facebook::jsi::Value const&, facebook::jsi::Value const*, unsigned long>(facebook::react::UIManagerBinding::get(facebook::jsi::Runtime&, facebook::jsi::PropNameID const&)::$_9&, facebook::jsi::Runtime&, facebook::jsi::Value const&, facebook::jsi::Value const*&&, unsigned long&&)","symbolLocation":72,"imageIndex":3},{"imageOffset":7163704,"symbol":"facebook::jsi::Value std::__1::__invoke_void_return_wrapper<facebook::jsi::Value, false>::__call[abi:de180100]<facebook::react::UIManagerBinding::get(facebook::jsi::Runtime&, facebook::jsi::PropNameID const&)::$_9&, facebook::jsi::Runtime&, facebook::jsi::Value const&, facebook::jsi::Value const*, unsigned long>(facebook::react::UIManagerBinding::get(facebook::jsi::Runtime&, facebook::jsi::PropNameID const&)::$_9&, facebook::jsi::Runtime&, facebook::jsi::Value const&, facebook::jsi::Value const*&&, unsigned long&&)","symbolLocation":64,"imageIndex":3},{"imageOffset":7163628,"symbol":"std::__1::__function::__alloc_func<facebook::react::UIManagerBinding::get(facebook::jsi::Runtime&, facebook::jsi::PropNameID const&)::$_9, std::__1::allocator<facebook::react::UIManagerBinding::get(facebook::jsi::Runtime&, facebook::jsi::PropNameID const&)::$_9>, facebook::jsi::Value (facebook::jsi::Runtime&, facebook::jsi::Value const&, facebook::jsi::Value const*, unsigned long)>::operator()[abi:de180100](facebook::jsi::Runtime&, facebook::jsi::Value const&, facebook::jsi::Value const*&&, unsigned long&&)","symbolLocation":72,"imageIndex":3},{"imageOffset":7158892,"symbol":"std::__1::__function::__func<facebook::react::UIManagerBinding::get(facebook::jsi::Runtime&, facebook::jsi::PropNameID const&)::$_9, std::__1::allocator<facebook::react::UIManagerBinding::get(facebook::jsi::Runtime&, facebook::jsi::PropNameID const&)::$_9>, facebook::jsi::Value (facebook::jsi::Runtime&, facebook::jsi::Value const&, facebook::jsi::Value const*, unsigned long)>::operator()(facebook::jsi::Runtime&, facebook::jsi::Value const&, facebook::jsi::Value const*&&, unsigned long&&)","symbolLocation":68,"imageIndex":3},{"imageOffset":84768,"symbol":"facebook::hermes::(anonymous namespace)::HermesRuntimeImpl::HFContext::func(void*, hermes::vm::Runtime&, hermes::vm::NativeArgs)","symbolLocation":532,"imageIndex":5},{"imageOffset":850776,"symbol":"hermes::vm::NativeFunction::_nativeCall(hermes::vm::NativeFunction*, hermes::vm::Runtime&)","symbolLocation":144,"imageIndex":5},{"imageOffset":957924,"symbol":"hermes::vm::CallResult<hermes::vm::HermesValue, (hermes::vm::detail::CallResultSpecialize)2> hermes::vm::Interpreter::interpretFunction<false, false>(hermes::vm::Runtime&, hermes::vm::InterpreterState&)","symbolLocation":2320,"imageIndex":5},{"imageOffset":955552,"symbol":"hermes::vm::Runtime::interpretFunctionImpl(hermes::vm::CodeBlock*)","symbolLocation":132,"imageIndex":5},{"imageOffset":851500,"symbol":"hermes::vm::JSFunction::_callImpl(hermes::vm::Handle<hermes::vm::Callable>, hermes::vm::Runtime&)","symbolLocation":40,"imageIndex":5},{"imageOffset":849468,"symbol":"hermes::vm::BoundFunction::_boundCall(hermes::vm::BoundFunction*, hermes::inst::Inst const*, hermes::vm::Runtime&)","symbolLocation":504,"imageIndex":5},{"imageOffset":45976,"symbol":"facebook::hermes::(anonymous namespace)::HermesRuntimeImpl::call(facebook::jsi::Function const&, facebook::jsi::Value const&, facebook::jsi::Value const*, unsigned long)","symbolLocation":748,"imageIndex":5},{"imageOffset":9780692,"symbol":"facebook::jsi::Function::call(facebook::jsi::Runtime&, facebook::jsi::Value const*, unsigned long) const","symbolLocation":100,"imageIndex":3},{"imageOffset":9780516,"symbol":"facebook::jsi::Function::call(facebook::jsi::Runtime&, std::initializer_list<facebook::jsi::Value>) const","symbolLocation":112,"imageIndex":3},{"imageOffset":10003192,"symbol":"facebook::react::Task::execute(facebook::jsi::Runtime&, bool)","symbolLocation":292,"imageIndex":3},{"imageOffset":9958908,"symbol":"facebook::react::RuntimeScheduler_Modern::executeTask(facebook::jsi::Runtime&, facebook::react::Task&, bool) const","symbolLocation":160,"imageIndex":3},{"imageOffset":9961796,"symbol":"facebook::react::RuntimeScheduler_Modern::runEventLoopTick(facebook::jsi::Runtime&, facebook::react::Task&)","symbolLocation":244,"imageIndex":3},{"imageOffset":9961076,"symbol":"facebook::react::RuntimeScheduler_Modern::runEventLoop(facebook::jsi::Runtime&)","symbolLocation":168,"imageIndex":3},{"imageOffset":9999584,"symbol":"facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0::operator()(facebook::jsi::Runtime&) const","symbolLocation":36,"imageIndex":3},{"imageOffset":9999536,"symbol":"decltype(std::declval<facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0&>()(std::declval<facebook::jsi::Runtime&>())) std::__1::__invoke[abi:de180100]<facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0&, facebook::jsi::Runtime&>(facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0&, facebook::jsi::Runtime&)","symbolLocation":32,"imageIndex":3},{"imageOffset":9999456,"symbol":"void std::__1::__invoke_void_return_wrapper<void, true>::__call[abi:de180100]<facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0&, facebook::jsi::Runtime&>(facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0&, facebook::jsi::Runtime&)","symbolLocation":32,"imageIndex":3},{"imageOffset":9999412,"symbol":"std::__1::__function::__alloc_func<facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0, std::__1::allocator<facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0>, void (facebook::jsi::Runtime&)>::operator()[abi:de180100](facebook::jsi::Runtime&)","symbolLocation":36,"imageIndex":3},{"imageOffset":9994944,"symbol":"std::__1::__function::__func<facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0, std::__1::allocator<facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0>, void (facebook::jsi::Runtime&)>::operator()(facebook::jsi::Runtime&)","symbolLocation":36,"imageIndex":3},{"imageOffset":10558608,"symbol":"std::__1::__function::__value_func<void (facebook::jsi::Runtime&)>::operator()[abi:de180100](facebook::jsi::Runtime&) const","symbolLocation":76,"imageIndex":3},{"imageOffset":10550776,"symbol":"std::__1::function<void (facebook::jsi::Runtime&)>::operator()(facebook::jsi::Runtime&) const","symbolLocation":32,"imageIndex":3},{"imageOffset":10549880,"symbol":"_ZZZN8facebook5react13ReactInstanceC1ENSt3__110unique_ptrINS0_9JSRuntimeENS2_14default_deleteIS4_EEEENS2_10shared_ptrINS0_18MessageQueueThreadEEENS8_INS0_12TimerManagerEEENS2_8functionIFvRNS_3jsi7RuntimeERKNS0_14JsErrorHandler14ProcessedErrorEEEEPNS0_18jsinspector_modern10HostTargetEENK3$_0clINSD_IFvSG_EEEEEDaT_ENKUlvE_clEv","symbolLocation":148,"imageIndex":3},{"imageOffset":10549720,"symbol":"_ZNSt3__18__invokeB8de180100IRZZN8facebook5react13ReactInstanceC1ENS_10unique_ptrINS2_9JSRuntimeENS_14default_deleteIS5_EEEENS_10shared_ptrINS2_18MessageQueueThreadEEENS9_INS2_12TimerManagerEEENS_8functionIFvRNS1_3jsi7RuntimeERKNS2_14JsErrorHandler14ProcessedErrorEEEEPNS2_18jsinspector_modern10HostTargetEENK3$_0clINSE_IFvSH_EEEEEDaT_EUlvE_JEEEDTclclsr3stdE7declvalISW_EEspclsr3stdE7declvalIT0_EEEEOSW_DpOSZ_","symbolLocation":24,"imageIndex":3},{"imageOffset":10549648,"symbol":"_ZNSt3__128__invoke_void_return_wrapperIvLb1EE6__callB8de180100IJRZZN8facebook5react13ReactInstanceC1ENS_10unique_ptrINS4_9JSRuntimeENS_14default_deleteIS7_EEEENS_10shared_ptrINS4_18MessageQueueThreadEEENSB_INS4_12TimerManagerEEENS_8functionIFvRNS3_3jsi7RuntimeERKNS4_14JsErrorHandler14ProcessedErrorEEEEPNS4_18jsinspector_modern10HostTargetEENK3$_0clINSG_IFvSJ_EEEEEDaT_EUlvE_EEEvDpOT_","symbolLocation":24,"imageIndex":3},{"imageOffset":10549612,"symbol":"_ZNSt3__110__function12__alloc_funcIZZN8facebook5react13ReactInstanceC1ENS_10unique_ptrINS3_9JSRuntimeENS_14default_deleteIS6_EEEENS_10shared_ptrINS3_18MessageQueueThreadEEENSA_INS3_12TimerManagerEEENS_8functionIFvRNS2_3jsi7RuntimeERKNS3_14JsErrorHandler14ProcessedErrorEEEEPNS3_18jsinspector_modern10HostTargetEENK3$_0clINSF_IFvSI_EEEEEDaT_EUlvE_NS_9allocatorISY_EEFvvEEclB8de180100Ev","symbolLocation":28,"imageIndex":3},{"imageOffset":10544804,"symbol":"_ZNSt3__110__function6__funcIZZN8facebook5react13ReactInstanceC1ENS_10unique_ptrINS3_9JSRuntimeENS_14default_deleteIS6_EEEENS_10shared_ptrINS3_18MessageQueueThreadEEENSA_INS3_12TimerManagerEEENS_8functionIFvRNS2_3jsi7RuntimeERKNS3_14JsErrorHandler14ProcessedErrorEEEEPNS3_18jsinspector_modern10HostTargetEENK3$_0clINSF_IFvSI_EEEEEDaT_EUlvE_NS_9allocatorISY_EEFvvEEclEv","symbolLocation":28,"imageIndex":3},{"imageOffset":2318056,"symbol":"std::__1::__function::__value_func<void ()>::operator()[abi:de180100]() const","symbolLocation":68,"imageIndex":3},{"imageOffset":2317832,"symbol":"std::__1::function<void ()>::operator()() const","symbolLocation":24,"imageIndex":3},{"imageOffset":2918700,"symbol":"facebook::react::tryAndReturnError(std::__1::function<void ()> const&)","symbolLocation":24,"imageIndex":3},{"imageOffset":2822464,"symbol":"facebook::react::RCTMessageThread::tryFunc(std::__1::function<void ()> const&)","symbolLocation":36,"imageIndex":3},{"imageOffset":2842280,"symbol":"facebook::react::RCTMessageThread::runOnQueue(std::__1::function<void ()>&&)::$_0::operator()() const","symbolLocation":80,"imageIndex":3},{"imageOffset":2842188,"symbol":"decltype(std::declval<facebook::react::RCTMessageThread::runOnQueue(std::__1::function<void ()>&&)::$_0&>()()) std::__1::__invoke[abi:de180100]<facebook::react::RCTMessageThread::runOnQueue(std::__1::function<void ()>&&)::$_0&>(facebook::react::RCTMessageThread::runOnQueue(std::__1::function<void ()>&&)::$_0&)","symbolLocation":24,"imageIndex":3},{"imageOffset":2842116,"symbol":"void std::__1::__invoke_void_return_wrapper<void, true>::__call[abi:de180100]<facebook::react::RCTMessageThread::runOnQueue(std::__1::function<void ()>&&)::$_0&>(facebook::react::RCTMessageThread::runOnQueue(std::__1::function<void ()>&&)::$_0&)","symbolLocation":24,"imageIndex":3},{"imageOffset":2842080,"symbol":"std::__1::__function::__alloc_func<facebook::react::RCTMessageThread::runOnQueue(std::__1::function<void ()>&&)::$_0, std::__1::allocator<facebook::react::RCTMessageThread::runOnQueue(std::__1::function<void ()>&&)::$_0>, void ()>::operator()[abi:de180100]()","symbolLocation":28,"imageIndex":3},{"imageOffset":2837248,"symbol":"std::__1::__function::__func<facebook::react::RCTMessageThread::runOnQueue(std::__1::function<void ()>&&)::$_0, std::__1::allocator<facebook::react::RCTMessageThread::runOnQueue(std::__1::function<void ()>&&)::$_0>, void ()>::operator()()","symbolLocation":28,"imageIndex":3},{"imageOffset":2318056,"symbol":"std::__1::__function::__value_func<void ()>::operator()[abi:de180100]() const","symbolLocation":68,"imageIndex":3},{"imageOffset":2317832,"symbol":"std::__1::function<void ()>::operator()() const","symbolLocation":24,"imageIndex":3},{"imageOffset":2821848,"symbol":"invocation function for block in facebook::react::RCTMessageThread::runAsync(std::__1::function<void ()>)","symbolLocation":48,"imageIndex":3},{"imageOffset":590060,"symbol":"__CFRUNLOOP_IS_CALLING_OUT_TO_A_BLOCK__","symbolLocation":20,"imageIndex":10},{"imageOffset":587812,"symbol":"__CFRunLoopDoBlocks","symbolLocation":352,"imageIndex":10},{"imageOffset":567000,"symbol":"__CFRunLoopRun","symbolLocation":2364,"imageIndex":10},{"imageOffset":563552,"symbol":"CFRunLoopRunSpecific","symbolLocation":536,"imageIndex":10},{"imageOffset":11158792,"symbol":"+[RCTJSThreadManager runRunLoop]","symbolLocation":292,"imageIndex":3},{"imageOffset":7830892,"symbol":"__NSThread__start__","symbolLocation":720,"imageIndex":14},{"imageOffset":26028,"symbol":"_pthread_start","symbolLocation":104,"imageIndex":8},{"imageOffset":6552,"symbol":"thread_start","symbolLocation":8,"imageIndex":8}],"id":17786040,"recursionInfoArray":[{"hottestElided":32,"coldestElided":26401,"depth":1556,"keyFrame":{"imageOffset":7390936,"symbol":"std::__1::__shared_weak_count::__release_shared[abi:de180100]()","symbolLocation":28,"imageIndex":3}},{"hottestElided":26509,"coldestElided":26558,"depth":25,"keyFrame":{"imageOffset":254036,"symbol":"facebook::yoga::calculateLayoutInternal(facebook::yoga::Node*, float, float, facebook::yoga::Direction, facebook::yoga::SizingMode, facebook::yoga::SizingMode, float, float, bool, facebook::yoga::LayoutPassReason, facebook::yoga::LayoutData&, unsigned int, unsigned int)","symbolLocation":1560,"imageIndex":3}}],"originalLength":26630,"triggered":true,"name":"com.facebook.react.runtime.JavaScript","threadState":{"x":[{"value":105553130180312},{"value":13025186424},{"value":25859},{"value":56},{"value":6062063152},{"value":37},{"value":0},{"value":13473993744},{"value":22287},{"value":18446744073709551615},{"value":1548097},{"value":936112},{"value":0},{"value":4336380376},{"value":0},{"value":0},{"value":6445577292,"symbolLocation":0,"symbol":"std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>>::~basic_string()"},{"value":6062063757},{"value":0},{"value":2},{"value":105553173992896},{"value":105553129587120},{"value":6144298720},{"value":6144298472},{"value":6144298472},{"value":4408216568},{"value":1970324836974592},{"value":18444773748872577023},{"value":2}],"flavor":"ARM_THREAD_STATE64","lr":{"value":4466624280},"cpsr":{"value":536875008},"fp":{"value":6143246384},"sp":{"value":6143246320},"esr":{"value":2449473607,"description":"(Data Abort) byte write Translation fault"},"pc":{"value":4466624404,"matchesCrashFrame":1},"far":{"value":6143246328}}},{"id":17786041,"name":"hades","threadState":{"x":[{"value":260},{"value":0},{"value":6656},{"value":0},{"value":0},{"value":160},{"value":0},{"value":0},{"value":6144880296},{"value":0},{"value":0},{"value":2},{"value":2},{"value":0},{"value":0},{"value":0},{"value":305},{"value":4039605721389570},{"value":0},{"value":105553171843840},{"value":105553171843904},{"value":6144880864},{"value":0},{"value":0},{"value":6656},{"value":6657},{"value":6912},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":4335250036},"cpsr":{"value":1610616832},"fp":{"value":6144880416},"sp":{"value":6144880272},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":4337139744},"far":{"value":0}},"frames":[{"imageOffset":16416,"symbol":"__psynch_cvwait","symbolLocation":8,"imageIndex":7},{"imageOffset":27252,"symbol":"_pthread_cond_wait","symbolLocation":976,"imageIndex":8},{"imageOffset":131740,"symbol":"std::__1::condition_variable::wait(std::__1::unique_lock<std::__1::mutex>&)","symbolLocation":24,"imageIndex":15},{"imageOffset":1781980,"symbol":"hermes::vm::HadesGC::Executor::worker()","symbolLocation":112,"imageIndex":5},{"imageOffset":1781824,"symbol":"void* std::__1::__thread_proxy[abi:nn180100]<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct>>, hermes::vm::HadesGC::Executor::Executor()::'lambda'()>>(void*)","symbolLocation":44,"imageIndex":5},{"imageOffset":26028,"symbol":"_pthread_start","symbolLocation":104,"imageIndex":8},{"imageOffset":6552,"symbol":"thread_start","symbolLocation":8,"imageIndex":8}]},{"id":17786045,"name":"com.apple.CFStream.LegacyThread","threadState":{"x":[{"value":268451845},{"value":21592279046},{"value":8589934592},{"value":181432303484928},{"value":0},{"value":181432303484928},{"value":2},{"value":4294967295},{"value":0},{"value":17179869184},{"value":0},{"value":2},{"value":0},{"value":0},{"value":42243},{"value":3072},{"value":18446744073709551569},{"value":338649581433858},{"value":0},{"value":4294967295},{"value":2},{"value":181432303484928},{"value":0},{"value":181432303484928},{"value":6145449976},{"value":8589934592},{"value":21592279046},{"value":18446744073709550527},{"value":4412409862}],"flavor":"ARM_THREAD_STATE64","lr":{"value":4337195276},"cpsr":{"value":4096},"fp":{"value":6145449824},"sp":{"value":6145449744},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":4337126256},"far":{"value":0}},"frames":[{"imageOffset":2928,"symbol":"mach_msg2_trap","symbolLocation":8,"imageIndex":7},{"imageOffset":71948,"symbol":"mach_msg2_internal","symbolLocation":72,"imageIndex":7},{"imageOffset":35856,"symbol":"mach_msg_overwrite","symbolLocation":480,"imageIndex":7},{"imageOffset":3812,"symbol":"mach_msg","symbolLocation":20,"imageIndex":7},{"imageOffset":588640,"symbol":"__CFRunLoopServiceMachPort","symbolLocation":156,"imageIndex":10},{"imageOffset":565796,"symbol":"__CFRunLoopRun","symbolLocation":1160,"imageIndex":10},{"imageOffset":563552,"symbol":"CFRunLoopRunSpecific","symbolLocation":536,"imageIndex":10},{"imageOffset":712488,"symbol":"_legacyStreamRunLoop_workThread","symbolLocation":260,"imageIndex":10},{"imageOffset":26028,"symbol":"_pthread_start","symbolLocation":104,"imageIndex":8},{"imageOffset":6552,"symbol":"thread_start","symbolLocation":8,"imageIndex":8}]},{"id":17786611,"name":"com.facebook.SocketRocket.NetworkThread","threadState":{"x":[{"value":268451845},{"value":21592279046},{"value":8589934592},{"value":78146929950720},{"value":0},{"value":78146929950720},{"value":2},{"value":4294967295},{"value":0},{"value":17179869184},{"value":0},{"value":2},{"value":0},{"value":0},{"value":18195},{"value":3072},{"value":18446744073709551569},{"value":40681930237186},{"value":0},{"value":4294967295},{"value":2},{"value":78146929950720},{"value":0},{"value":78146929950720},{"value":6132309320},{"value":8589934592},{"value":21592279046},{"value":18446744073709550527},{"value":4412409862}],"flavor":"ARM_THREAD_STATE64","lr":{"value":4337195276},"cpsr":{"value":4096},"fp":{"value":6132309168},"sp":{"value":6132309088},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":4337126256},"far":{"value":0}},"frames":[{"imageOffset":2928,"symbol":"mach_msg2_trap","symbolLocation":8,"imageIndex":7},{"imageOffset":71948,"symbol":"mach_msg2_internal","symbolLocation":72,"imageIndex":7},{"imageOffset":35856,"symbol":"mach_msg_overwrite","symbolLocation":480,"imageIndex":7},{"imageOffset":3812,"symbol":"mach_msg","symbolLocation":20,"imageIndex":7},{"imageOffset":588640,"symbol":"__CFRunLoopServiceMachPort","symbolLocation":156,"imageIndex":10},{"imageOffset":565796,"symbol":"__CFRunLoopRun","symbolLocation":1160,"imageIndex":10},{"imageOffset":563552,"symbol":"CFRunLoopRunSpecific","symbolLocation":536,"imageIndex":10},{"imageOffset":7671588,"symbol":"-[NSRunLoop(NSRunLoop) runMode:beforeDate:]","symbolLocation":208,"imageIndex":14},{"imageOffset":367632,"symbol":"-[SRRunLoopThread main]","symbolLocation":260,"imageIndex":4},{"imageOffset":7830892,"symbol":"__NSThread__start__","symbolLocation":720,"imageIndex":14},{"imageOffset":26028,"symbol":"_pthread_start","symbolLocation":104,"imageIndex":8},{"imageOffset":6552,"symbol":"thread_start","symbolLocation":8,"imageIndex":8}]},{"id":17786612,"name":"com.apple.NSURLConnectionLoader","threadState":{"x":[{"value":268451845},{"value":21592279046},{"value":8589934592},{"value":144358145785856},{"value":0},{"value":144358145785856},{"value":2},{"value":4294967295},{"value":0},{"value":17179869184},{"value":0},{"value":2},{"value":0},{"value":0},{"value":33611},{"value":3072},{"value":18446744073709551569},{"value":25288767444738},{"value":0},{"value":4294967295},{"value":2},{"value":144358145785856},{"value":0},{"value":144358145785856},{"value":6132882744},{"value":8589934592},{"value":21592279046},{"value":18446744073709550527},{"value":4412409862}],"flavor":"ARM_THREAD_STATE64","lr":{"value":4337195276},"cpsr":{"value":4096},"fp":{"value":6132882592},"sp":{"value":6132882512},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":4337126256},"far":{"value":0}},"frames":[{"imageOffset":2928,"symbol":"mach_msg2_trap","symbolLocation":8,"imageIndex":7},{"imageOffset":71948,"symbol":"mach_msg2_internal","symbolLocation":72,"imageIndex":7},{"imageOffset":35856,"symbol":"mach_msg_overwrite","symbolLocation":480,"imageIndex":7},{"imageOffset":3812,"symbol":"mach_msg","symbolLocation":20,"imageIndex":7},{"imageOffset":588640,"symbol":"__CFRunLoopServiceMachPort","symbolLocation":156,"imageIndex":10},{"imageOffset":565796,"symbol":"__CFRunLoopRun","symbolLocation":1160,"imageIndex":10},{"imageOffset":563552,"symbol":"CFRunLoopRunSpecific","symbolLocation":536,"imageIndex":10},{"imageOffset":2127120,"symbol":"+[__CFN_CoreSchedulingSetRunnable _run:]","symbolLocation":372,"imageIndex":16},{"imageOffset":7830892,"symbol":"__NSThread__start__","symbolLocation":720,"imageIndex":14},{"imageOffset":26028,"symbol":"_pthread_start","symbolLocation":104,"imageIndex":8},{"imageOffset":6552,"symbol":"thread_start","symbolLocation":8,"imageIndex":8}]},{"id":17786613,"name":"com.apple.CFSocket.private","threadState":{"x":[{"value":4},{"value":0},{"value":105553116302656},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":6135181536},{"value":0},{"value":4947131664},{"value":31},{"value":31},{"value":4947132144},{"value":72057602293157273,"symbolLocation":72057594037927937,"symbol":"OBJC_CLASS_$___NSCFArray"},{"value":8255229336,"symbolLocation":0,"symbol":"OBJC_CLASS_$___NSCFArray"},{"value":93},{"value":6446663680,"symbolLocation":0,"symbol":"-[__NSCFArray objectAtIndex:]"},{"value":0},{"value":32},{"value":8255251480,"symbolLocation":0,"symbol":"__CFActiveSocketsLock"},{"value":1},{"value":4349121600},{"value":23},{"value":105553116302656},{"value":105553116302608},{"value":0},{"value":8053586520,"symbolLocation":0,"symbol":"__kCFNull"},{"value":6135180892}],"flavor":"ARM_THREAD_STATE64","lr":{"value":6446814628},"cpsr":{"value":1610616832},"fp":{"value":6135181248},"sp":{"value":6135147472},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":4337168256},"far":{"value":0}},"frames":[{"imageOffset":44928,"symbol":"__select","symbolLocation":8,"imageIndex":7},{"imageOffset":648612,"symbol":"__CFSocketManager","symbolLocation":676,"imageIndex":10},{"imageOffset":26028,"symbol":"_pthread_start","symbolLocation":104,"imageIndex":8},{"imageOffset":6552,"symbol":"thread_start","symbolLocation":8,"imageIndex":8}]},{"id":17786819,"name":"hades","threadState":{"x":[{"value":260},{"value":0},{"value":0},{"value":0},{"value":0},{"value":160},{"value":0},{"value":0},{"value":6135754408},{"value":0},{"value":0},{"value":2},{"value":2},{"value":0},{"value":0},{"value":0},{"value":305},{"value":0},{"value":0},{"value":105553172073744},{"value":105553172073808},{"value":6135754976},{"value":0},{"value":0},{"value":0},{"value":1},{"value":256},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":4335250036},"cpsr":{"value":1610616832},"fp":{"value":6135754528},"sp":{"value":6135754384},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":4337139744},"far":{"value":0}},"frames":[{"imageOffset":16416,"symbol":"__psynch_cvwait","symbolLocation":8,"imageIndex":7},{"imageOffset":27252,"symbol":"_pthread_cond_wait","symbolLocation":976,"imageIndex":8},{"imageOffset":131740,"symbol":"std::__1::condition_variable::wait(std::__1::unique_lock<std::__1::mutex>&)","symbolLocation":24,"imageIndex":15},{"imageOffset":1781980,"symbol":"hermes::vm::HadesGC::Executor::worker()","symbolLocation":112,"imageIndex":5},{"imageOffset":1781824,"symbol":"void* std::__1::__thread_proxy[abi:nn180100]<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct>>, hermes::vm::HadesGC::Executor::Executor()::'lambda'()>>(void*)","symbolLocation":44,"imageIndex":5},{"imageOffset":26028,"symbol":"_pthread_start","symbolLocation":104,"imageIndex":8},{"imageOffset":6552,"symbol":"thread_start","symbolLocation":8,"imageIndex":8}]},{"id":17952426,"frames":[],"threadState":{"x":[{"value":6138081280},{"value":133791},{"value":6137544704},{"value":0},{"value":409604},{"value":18446744073709551615},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":0},"cpsr":{"value":4096},"fp":{"value":0},"sp":{"value":6138081280},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":4335229316},"far":{"value":0}}},{"id":17952890,"frames":[],"threadState":{"x":[{"value":13469872128},{"value":168887},{"value":13469335552},{"value":0},{"value":409604},{"value":18446744073709551615},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":0},"cpsr":{"value":4096},"fp":{"value":0},"sp":{"value":13469872128},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":4335229316},"far":{"value":0}}},{"id":17953437,"frames":[],"threadState":{"x":[{"value":13497331712},{"value":97603},{"value":13496795136},{"value":0},{"value":409604},{"value":18446744073709551615},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":0},"cpsr":{"value":4096},"fp":{"value":0},"sp":{"value":13497331712},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":4335229316},"far":{"value":0}}},{"id":17953441,"frames":[],"threadState":{"x":[{"value":13499625472},{"value":118675},{"value":13499088896},{"value":0},{"value":409604},{"value":18446744073709551615},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":0},"cpsr":{"value":4096},"fp":{"value":0},"sp":{"value":13499625472},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":4335229316},"far":{"value":0}}},{"id":17953442,"frames":[],"threadState":{"x":[{"value":13504507904},{"value":0},{"value":13503971328},{"value":0},{"value":278532},{"value":18446744073709551615},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":0},"cpsr":{"value":4096},"fp":{"value":0},"sp":{"value":13504507904},"esr":{"value":0},"pc":{"value":4335229316},"far":{"value":0}}}],
  "usedImages" : [
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 4337565696,
    "size" : 655360,
    "uuid" : "bc4db5f4-1c64-3706-8006-73b78c3e1f1a",
    "path" : "\/usr\/lib\/dyld",
    "name" : "dyld"
  },
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 4335124480,
    "CFBundleShortVersionString" : "1.0.0",
    "CFBundleIdentifier" : "berlin.cypherpunkacademy.ragapp",
    "size" : 16384,
    "uuid" : "da21dc10-e669-35ed-82f6-f025f770edb3",
    "path" : "\/Users\/USER\/Library\/Developer\/CoreSimulator\/Devices\/0142B3C6-1A4A-4584-8A98-C792E87DFCDD\/data\/Containers\/Bundle\/Application\/F5EBD18C-E7CE-464C-BC35-BBDD2B698C97\/PhilovonFreisinn.app\/PhilovonFreisinn",
    "name" : "PhilovonFreisinn",
    "CFBundleVersion" : "1"
  },
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 4371890176,
    "size" : 11042816,
    "uuid" : "af61534c-2ace-389f-9ed2-ca2862da7f22",
    "path" : "\/Users\/USER\/Library\/Developer\/CoreSimulator\/Devices\/0142B3C6-1A4A-4584-8A98-C792E87DFCDD\/data\/Containers\/Bundle\/Application\/F5EBD18C-E7CE-464C-BC35-BBDD2B698C97\/PhilovonFreisinn.app\/PhilovonFreisinn.debug.dylib",
    "name" : "PhilovonFreisinn.debug.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 4459233280,
    "CFBundleShortVersionString" : "1.0",
    "CFBundleIdentifier" : "react-native.React",
    "size" : 14761984,
    "uuid" : "ac487519-d12b-3ed8-b013-5010ec9bc032",
    "path" : "\/Users\/USER\/Library\/Developer\/CoreSimulator\/Devices\/0142B3C6-1A4A-4584-8A98-C792E87DFCDD\/data\/Containers\/Bundle\/Application\/F5EBD18C-E7CE-464C-BC35-BBDD2B698C97\/PhilovonFreisinn.app\/Frameworks\/React.framework\/React",
    "name" : "React",
    "CFBundleVersion" : "1"
  },
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 4343382016,
    "CFBundleShortVersionString" : "1.0",
    "CFBundleIdentifier" : "third-party.ReactNativeDependencies",
    "size" : 1474560,
    "uuid" : "1c45f8d4-664a-3470-8fd0-341a04b1a28c",
    "path" : "\/Users\/USER\/Library\/Developer\/CoreSimulator\/Devices\/0142B3C6-1A4A-4584-8A98-C792E87DFCDD\/data\/Containers\/Bundle\/Application\/F5EBD18C-E7CE-464C-BC35-BBDD2B698C97\/PhilovonFreisinn.app\/Frameworks\/ReactNativeDependencies.framework\/ReactNativeDependencies",
    "name" : "ReactNativeDependencies",
    "CFBundleVersion" : "1"
  },
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 4353998848,
    "CFBundleShortVersionString" : "0.12.0",
    "CFBundleIdentifier" : "dev.hermesengine.iphonesimulator",
    "size" : 3702784,
    "uuid" : "944bd49b-ad2e-3e3c-96ac-0603909fdd97",
    "path" : "\/Users\/USER\/Library\/Developer\/CoreSimulator\/Devices\/0142B3C6-1A4A-4584-8A98-C792E87DFCDD\/data\/Containers\/Bundle\/Application\/F5EBD18C-E7CE-464C-BC35-BBDD2B698C97\/PhilovonFreisinn.app\/Frameworks\/hermes.framework\/hermes",
    "name" : "hermes",
    "CFBundleVersion" : "0.12.0"
  },
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 4335632384,
    "size" : 32768,
    "uuid" : "9463fc06-cc7c-38e8-ad3c-1b9f2617df53",
    "path" : "\/usr\/lib\/system\/libsystem_platform.dylib",
    "name" : "libsystem_platform.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 4337123328,
    "size" : 245760,
    "uuid" : "1a15cc38-efcc-34ea-a261-cfd370f4b557",
    "path" : "\/usr\/lib\/system\/libsystem_kernel.dylib",
    "name" : "libsystem_kernel.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 4335222784,
    "size" : 65536,
    "uuid" : "b1095734-2a4d-3e8c-839e-b10ae9598d61",
    "path" : "\/usr\/lib\/system\/libsystem_pthread.dylib",
    "name" : "libsystem_pthread.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 4339875840,
    "size" : 49152,
    "uuid" : "5456a55f-46e1-386f-a22e-35e385923f2d",
    "path" : "\/Volumes\/VOLUME\/*\/libobjc-trampolines.dylib",
    "name" : "libobjc-trampolines.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 6446166016,
    "CFBundleShortVersionString" : "6.9",
    "CFBundleIdentifier" : "com.apple.CoreFoundation",
    "size" : 3997696,
    "uuid" : "5f40c0e3-6b50-30c6-a686-3ab03c9a5404",
    "path" : "\/Volumes\/VOLUME\/*\/CoreFoundation.framework\/CoreFoundation",
    "name" : "CoreFoundation",
    "CFBundleVersion" : "3038.1.101"
  },
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 6712459264,
    "CFBundleShortVersionString" : "1.0",
    "CFBundleIdentifier" : "com.apple.GraphicsServices",
    "size" : 36864,
    "uuid" : "587e9fae-3ada-346c-a206-e2949d400fff",
    "path" : "\/Volumes\/VOLUME\/*\/GraphicsServices.framework\/GraphicsServices",
    "name" : "GraphicsServices",
    "CFBundleVersion" : "1.0"
  },
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 6522671104,
    "CFBundleShortVersionString" : "1.0",
    "CFBundleIdentifier" : "com.apple.UIKitCore",
    "size" : 30367744,
    "uuid" : "d41f23e0-fb5e-33e4-9687-bb277a61190f",
    "path" : "\/Volumes\/VOLUME\/*\/UIKitCore.framework\/UIKitCore",
    "name" : "UIKitCore",
    "CFBundleVersion" : "8081.1.108"
  },
  {
    "size" : 0,
    "source" : "A",
    "base" : 0,
    "uuid" : "00000000-0000-0000-0000-000000000000"
  },
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 6450683904,
    "CFBundleShortVersionString" : "6.9",
    "CFBundleIdentifier" : "com.apple.Foundation",
    "size" : 12873728,
    "uuid" : "1a4bc02e-f4dc-3ab5-9bb7-61d28064ffe8",
    "path" : "\/Volumes\/VOLUME\/*\/Foundation.framework\/Foundation",
    "name" : "Foundation",
    "CFBundleVersion" : "3038.1.101"
  },
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 6445477888,
    "size" : 536564,
    "uuid" : "c996ec67-9783-3d31-85ad-67b6bda4349c",
    "path" : "\/Volumes\/VOLUME\/*\/libc++.1.dylib",
    "name" : "libc++.1.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 6517628928,
    "CFBundleShortVersionString" : "1.0",
    "CFBundleIdentifier" : "com.apple.CFNetwork",
    "size" : 3665920,
    "uuid" : "722d2929-fe22-39d0-81cf-4cf7e2bb9caa",
    "path" : "\/Volumes\/VOLUME\/*\/CFNetwork.framework\/CFNetwork",
    "name" : "CFNetwork",
    "CFBundleVersion" : "1568.100.1"
  }
],
  "sharedCache" : {
  "base" : 6442450944,
  "size" : 3788177408,
  "uuid" : "41b989b6-4eda-30f5-ba7a-4bdfcb7b3db2"
},
  "vmSummary" : "ReadOnly portion of Libraries: Total=1.6G resident=0K(0%) swapped_out_or_unallocated=1.6G(100%)\nWritable regions: Total=4.8G written=5567K(0%) resident=3967K(0%) swapped_out=1600K(0%) unallocated=4.8G(100%)\n\n                                VIRTUAL   REGION \nREGION TYPE                        SIZE    COUNT (non-coalesced) \n===========                     =======  ======= \nActivity Tracing                   256K        1 \nCG raster data                    19.0M       24 \nColorSync                          144K        5 \nCoreAnimation                     63.9M      201 \nFoundation                          16K        1 \nIOSurface                          624K        1 \nKernel Alloc Once                   32K        1 \nMALLOC                             4.4G      253 \nMALLOC guard page                  288K       18 \nSQLite page cache                 1024K        8 \nSTACK GUARD                       56.2M       14 \nStack                             15.4M       14 \nVM_ALLOCATE                      266.0M      201 \n__DATA                            30.1M      769 \n__DATA_CONST                      84.9M      787 \n__DATA_DIRTY                       139K       11 \n__FONT_DATA                        2352        1 \n__LINKEDIT                       735.8M       11 \n__OBJC_RW                         2686K        1 \n__TEXT                           877.7M      800 \n__TPRO_CONST                       148K        2 \ndyld private memory                2.6G       24 \nlibnetwork                         128K        8 \nmapped file                      441.8M      287 \npage table in kernel              3967K        1 \nshared memory                       16K        1 \n===========                     =======  ======= \nTOTAL                              9.6G     3445 \n",
  "legacyInfo" : {
  "threadTriggered" : {
    "name" : "com.facebook.react.runtime.JavaScript"
  }
},
  "logWritingSignature" : "a9c9b2463bcd20e6d619e19f5c6501231ee08d33",
  "bug_type" : "309",
  "roots_installed" : 0,
  "trmStatus" : 1,
  "trialInfo" : {
  "rollouts" : [
    {
      "rolloutId" : "65a8173205d942272410674b",
      "factorPackIds" : [
        "65d39fa4cb0e2417d11ce5f6"
      ],
      "deploymentId" : 240000001
    },
    {
      "rolloutId" : "652eff3d1bce5442b8d753c9",
      "factorPackIds" : [

      ],
      "deploymentId" : 240000009
    }
  ],
  "experiments" : [

  ]
}
}

Model: MacBookPro18,4, BootROM 13822.81.10, proc 10:8:2 processors, 32 GB, SMC 
Graphics: Apple M1 Max, Apple M1 Max, Built-In
Display: Color LCD, 3024 x 1964 Retina, Main, MirrorOff, Online
Display: N07, 3840 x 2160 (2160p/4K UHD 1 - Ultra High Definition), MirrorOff, Online
Display: LG Ultra HD, 3840 x 2160 (2160p/4K UHD 1 - Ultra High Definition), MirrorOff, Online
Memory Module: LPDDR5, Samsung
AirPort: spairport_wireless_card_type_wifi (0x14E4, 0x4387), wl0: Dec  6 2025 00:29:24 version 20.131.5.0.8.7.216 FWID 01-a22d1730
IO80211_driverkit-1540.16 "IO80211_driverkit-1540.16" Jan 27 2026 21:04:24
AirPort: 
Bluetooth: Version (null), 0 services, 0 devices, 0 incoming serial ports
Network Service: Wi-Fi, AirPort, en0
Thunderbolt Bus: MacBook Pro, Apple Inc.
Thunderbolt Bus: MacBook Pro, Apple Inc.
Thunderbolt Bus: MacBook Pro, Apple Inc.
